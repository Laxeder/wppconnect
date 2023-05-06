import type { LocationMessageTranspiled, PollMessaeTranspiled, ReactionMessageTranspiled } from "../types/messages";

import { ButtonMessage, ContactMessage, FileMessage, ImageMessage, ListMessage, LocationMessage, MediaMessage, Message, PollMessage, ReactionMessage, StickerMessage, VideoMessage } from "rompot";
import { WAJS } from "@wppconnect-team/wppconnect";

import { MessageTranspilerType } from "@enums/messages";
import WPPConnect from "@api/WPPConnect";
import { getID } from "@utils/generic";
import { extractMetadata } from "@laxeder/wa-sticker/dist";

export default class MessageTranspiler<M extends Message> {
  public isGif?: boolean;
  public isViewOnce?: boolean;

  public chat: string = "";
  public content: any = "";
  public media: string = "";
  public quotedMsg: string = "";
  public options: WAJS.chat.AllMessageOptions = {};

  public wpp: WPPConnect;
  public message: Message;
  public type: MessageTranspilerType;

  constructor(wpp: WPPConnect, message: M) {
    this.wpp = wpp;
    this.message = message;
    this.type = MessageTranspiler.getType(message);

    this.options = { detectMentioned: true };
  }

  public async transpile(): Promise<this> {
    await this.transpileChat();
    await this.transpileContent();

    return this;
  }

  public async transpileChat() {
    this.chat = getID(this.message.chat.id);
  }

  public async transpileContent() {
    this.content = this.message.text;
    this.options.mentionedList = this.message.mentions;

    const includesMention = await this.transpileMention();

    const isPoll = await this.transpilePollMessage();
    const isList = await this.transpileListMessage();
    const isMedia = await this.transpileMediaMessage();
    const isButton = await this.transpileButtonMessage();
    const isContact = await this.transpileContactMessage();
    const isReaction = await this.transpileReactionMessage();
    const isLocation = await this.transpileLocationMessage();
  }

  public async transpileMention() {
    if (!this.message.mention) return false;

    this.options.quotedMsg = this.message.mention.id;
    this.quotedMsg = this.message.mention.id;

    return true;
  }

  public async transpileMediaMessage() {
    if (!(this.message instanceof MediaMessage)) return false;

    const stream = await this.message.getStream();

    if (!stream || !Buffer.isBuffer(stream)) return false;

    this.isGif = this.message.isGIF;

    if (this.message instanceof FileMessage) {
      this.type = MessageTranspilerType.File;
      this.media = stream.toString("base64");
    }

    if (this.message instanceof ImageMessage) {
      this.type = MessageTranspilerType.Image;
      this.media = stream.toString("base64");
    }

    if (this.message instanceof VideoMessage) {
      this.type = MessageTranspilerType.Video;
      this.media = stream.toString("base64");
    }

    if (this.message instanceof StickerMessage) {
      this.type = MessageTranspilerType.Sticker;

      try {
        await extractMetadata(stream)
          .then((data) => {
            if (this.message instanceof StickerMessage) {
              this.message.pack = data["sticker-pack-name"] || "";
              this.message.author = data["sticker-pack-publisher"] || "";
              //   this.message.id = data["sticker-pack-id"] || this.message.id;
            }
          })
          .catch((err) => {
            this.wpp.ev.emit("error", err);
          });
      } catch (err) {
        this.wpp.ev.emit("error", err);
      }
      this.media = stream.toString("base64");
    }

    return true;
  }

  public async transpileLocationMessage() {
    if (!(this.message instanceof LocationMessage)) return false;

    this.type = MessageTranspilerType.Location;

    this.content = { lat: this.message.latitude, lng: this.message.longitude };

    return true;
  }

  public async transpileContactMessage() {
    if (!(this.message instanceof ContactMessage)) return false;

    const contacts = this.message.contacts.map((contact) => {
      return { id: contact.id, name: contact.name };
    });

    if (contacts.length < 2) {
      this.type = MessageTranspilerType.Contact;

      if (contacts.length < 1) contacts.push({ id: "", name: "" });

      this.content = contacts[0];
    } else {
      this.type = MessageTranspilerType.ContactList;

      this.content = contacts;
    }

    return true;
  }

  public async transpileReactionMessage() {
    if (!(this.message instanceof ReactionMessage)) return false;

    this.type = MessageTranspilerType.Reaction;

    this.content = { msgId: this.message.id, reaction: !!!this.message.text ? false : this.message.text };

    return true;
  }

  public async transpilePollMessage() {
    if (!(this.message instanceof PollMessage)) return false;

    this.type = MessageTranspilerType.Poll;

    this.content = { name: this.message.text, choices: this.message.options.map((option) => option.name) };

    return true;
  }

  public async transpileListMessage() {
    if (!(this.message instanceof ListMessage)) return false;

    this.type = MessageTranspilerType.List;

    this.content = {
      buttonText: this.message.button,
      description: this.message.text,
      title: this.message.title,
      footer: this.message.footer,
      sections: this.message.list.map((list) => {
        return {
          title: list.title,
          rows: list.items.map((item) => {
            return {
              rowId: item.id,
              title: item.title,
              description: item.description,
            };
          }),
        };
      }),
    };

    return true;
  }

  public async transpileButtonMessage() {
    if (!(this.message instanceof ButtonMessage)) return false;

    this.type = MessageTranspilerType.Button;

    this.options.title = this.message.text;
    this.options.footer = this.message.footer;

    this.options.buttons = this.message.buttons.map((button) => {
      if (button.type == "url") {
        return { url: button.content, text: button.content };
      }

      if (button.type == "call") {
        return { phoneNumber: button.content, text: button.text };
      }

      if (button.type == "reply") {
        return { id: button.content, text: button.text };
      }
    });

    return true;
  }

  public static async sendMessage(wpp: WPPConnect, message: Message) {
    let { chat, type, content, options, media, isGif, isViewOnce, quotedMsg } = await MessageTranspiler.Transpile(wpp, message);

    //? Fix values
    type = MessageTranspiler.getType(message);
    content = MessageTranspiler.getContent(type, content);

    if (type == MessageTranspilerType.Text) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendText(chat, content, options)))?.id;
    }

    if (type == MessageTranspilerType.File) {
      console.log(await wpp.wcb.waitCall(() => wpp.client.sendFile(chat, media, options)));
    }

    if (type == MessageTranspilerType.Video) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendVideoAsGifFromBase64(chat, media, "", content, quotedMsg)))?.id;
    }

    if (type == MessageTranspilerType.Image) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendImageFromBase64(chat, media, "", content, quotedMsg, isViewOnce)))?.id;
    }

    if (type == MessageTranspilerType.Sticker) {
      if (isGif) {
        message.id = (await wpp.wcb.waitCall(() => wpp.client.sendImageAsStickerGif(chat, media)))?.id;
      } else {
        message.id = (await wpp.wcb.waitCall(() => wpp.client.sendImageAsSticker(chat, media)))?.id;
      }
    }

    if (type == MessageTranspilerType.Reaction) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendReactionToMessage(content.msgId, content.reaction)))?.sendMsgResult;
    }

    if (type == MessageTranspilerType.Poll) {
      const res: any = await wpp.wcb.waitCall(() => wpp.client.sendPollMessage(chat, content.name, content.choices));

      if (!!res && typeof res == "object") {
        if (message instanceof PollMessage) message.secretKey = res.messageSecret;

        message.id = res.id;
      }
    }

    if (type == MessageTranspilerType.Contact) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendContactVcard(chat, content.id, content.name)))?.id;
    }

    if (type == MessageTranspilerType.ContactList) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendContactVcardList(chat, content)))?.id;
    }

    if (type == MessageTranspilerType.Button) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendText(chat, content, options)))?.id;
    }

    if (type == MessageTranspilerType.List) {
      message.id = (await wpp.wcb.waitCall(() => wpp.client.sendListMessage(chat, { ...options, ...content })))?.id;
    }

    return message;
  }

  public static getType<T extends Message>(message: T) {
    if (message instanceof FileMessage) return MessageTranspilerType.File;
    if (message instanceof ImageMessage) return MessageTranspilerType.Image;
    if (message instanceof VideoMessage) return MessageTranspilerType.Video;
    if (message instanceof StickerMessage) return MessageTranspilerType.Sticker;
    if (message instanceof LocationMessage) return MessageTranspilerType.Location;
    if (message instanceof ReactionMessage) return MessageTranspilerType.Reaction;
    if (message instanceof ButtonMessage) return MessageTranspilerType.Button;
    if (message instanceof ListMessage) return MessageTranspilerType.List;
    if (message instanceof PollMessage) return MessageTranspilerType.Poll;

    if (message instanceof ContactMessage) {
      if (message.contacts.length > 1) return MessageTranspilerType.ContactList;
      return MessageTranspilerType.Contact;
    }

    return MessageTranspilerType.Text;
  }

  public static getContent<T extends MessageTranspilerType>(type: T, content: any) {
    if (type == MessageTranspilerType.Contact) {
      return { id: content?.id || "", name: content?.name || "" } as WAJS.chat.VCardContact;
    }

    if (type == MessageTranspilerType.ContactList) {
      return (Array.isArray(content) ? content : []) as WAJS.chat.ChatListOptions;
    }

    if (type == MessageTranspilerType.Reaction) {
      return { msgId: content?.msgId || "", reaction: content?.reaction || "" } as ReactionMessageTranspiled;
    }

    if (type == MessageTranspilerType.Location) {
      return { lat: content?.lat || "", lng: content?.lng || "" } as LocationMessageTranspiled;
    }

    if (type == MessageTranspilerType.Poll) {
      return { name: content?.name || "", choices: content?.choices || [] } as PollMessaeTranspiled;
    }

    if (type == MessageTranspilerType.List) {
      return {
        buttonText: content?.buttonText || "",
        description: content?.description || "",
        title: content?.title || "",
        footer: content?.footer || "",
        sections: content?.sections || [],
      } as WAJS.chat.ListMessageOptions;
    }

    return content as string;
  }

  public static async Transpile<M extends Message>(wpp: WPPConnect, message: M) {
    const transpiler = new MessageTranspiler(wpp, message);

    await transpiler.transpile();

    return transpiler;
  }
}
