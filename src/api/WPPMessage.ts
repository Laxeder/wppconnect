import * as model from "@wppconnect-team/wppconnect/dist/api/model/message";
import { MessageType } from "@wppconnect-team/wppconnect";
import { Chat, FileMessage, ImageMessage, Media, MediaMessage, Message, StickerMessage, User, VideoMessage } from "rompot";

import { getChatFromMessage, getID, getUserFromMessage, replaceID } from "@utils/generic";
import WPPConnect from "@api/WPPConnect";

export default class WPPMessage {
  public wpp: WPPConnect;
  public wamsg: model.Message;

  public isValid: boolean = false;
  public chat: Chat = new Chat("");
  public user: User = new User("");
  public message: Message = new Message("", "");

  constructor(wpp: WPPConnect, wamsg: model.Message) {
    this.wpp = wpp;
    this.wamsg = wamsg;
  }

  public async read() {
    const isValid = this.valid();

    this.isValid = isValid;

    if (!isValid) {
      //TODO: Add empty message
      //   this.message = new EmptyMessage();
      return;
    }

    await this.readUser();
    await this.readChat();
    await this.readMessage();

    this.message.chat = this.chat;
    this.message.user = this.user;

    return this;
  }

  public valid() {
    if (!this.wamsg) return false;
    if (!this.wamsg.sender) return false;

    if (this.wamsg.type == MessageType.CHAT) return true;
    if (this.wamsg.type == MessageType.LIST) return true;
    if (this.wamsg.type == MessageType.AUDIO) return true;
    if (this.wamsg.type == MessageType.IMAGE) return true;
    if (this.wamsg.type == MessageType.VIDEO) return true;
    if (this.wamsg.type == MessageType.VCARD) return true;
    if (this.wamsg.type == MessageType.STICKER) return true;
    if (this.wamsg.type == MessageType.DOCUMENT) return true;
    if (this.wamsg.type == MessageType.LOCATION) return true;
    if (this.wamsg.type == MessageType.MULTI_VCARD) return true;
    if (this.wamsg.type == MessageType.LIST_RESPONSE) return true;
    if (this.wamsg.type == MessageType.BUTTONS_RESPONSE) return true;
    if (this.wamsg.type == MessageType.TEMPLATE_BUTTON_REPLY) return true;

    return false;
  }

  public async readChat() {
    const chatId = getChatFromMessage(this.wamsg);
    const chat = new Chat(chatId);

    this.chat = (await this.wpp.getChat(chat)) || chat;

    this.chat.id = chatId;
    this.chat.type = this.wamsg.isGroupMsg ? "group" : "pv";

    if (this.chat.type == "pv" && this.user.id != this.wpp.id) {
      this.chat.name = this.wamsg.sender.pushname || this.wamsg.sender.verifiedName || this.wamsg.sender.name || "";
    }
  }

  public async readUser() {
    const userId = getUserFromMessage(this.wamsg);
    const user = new User(replaceID(userId));

    this.user = (await this.wpp.getUser(user)) || user;

    this.user.id = replaceID(userId);

    const name = this.wamsg.sender.pushname || this.wamsg.sender.verifiedName || this.wamsg.sender.name || "";

    if (!!name && this.user.name != name) {
      this.user.name = name;
    }
  }

  public async readMessage() {
    await this.readMediaMessage();
    await this.readMentionMessage();

    this.message.id = this.wamsg.id;
    this.message.apiSend = this.message.id.includes("true");
    this.message.text = !!this.message.text ? this.message.text : this.wamsg.body || this.wamsg.content || "";
    this.message.fromMe = getID(this.wamsg.from) == getID(this.wpp.id);
    this.message.timestamp = this.wamsg.timestamp;

    this.readInteractiveResponse();
  }

  public async readMentionMessage() {
    if (this.wamsg.quotedMsgId) {
      const mention = await this.wpp.wcb.waitCall(() => this.wpp.client.getMessageById(this.wamsg.quotedMsgId));

      if (!!mention) {
        const { message, isValid } = await WPPMessage.Read(this.wpp, mention);

        if (isValid) this.message.mention = message;
      }
    }
  }

  public async readMediaMessage() {
    const anyMsg: any & Message = this.wamsg;

    const media: Media = { stream: anyMsg };

    if (this.wamsg.type == MessageType.DOCUMENT) {
      this.message = new FileMessage(this.chat, anyMsg.caption || "", media);
    }

    if (this.wamsg.type == MessageType.IMAGE) {
      this.message = new ImageMessage(this.chat, anyMsg.caption || "", media);
    }

    if (this.wamsg.type == MessageType.VIDEO) {
      this.message = new VideoMessage(this.chat, anyMsg.caption || "", media);
    }

    if (this.wamsg.type == MessageType.STICKER) {
      this.message = new StickerMessage(this.chat, media);
    }
  }

  public readInteractiveResponse() {
    if (this.wamsg.type == MessageType.BUTTONS_RESPONSE) {
      this.message.selected = this.wamsg.content || this.wamsg.body;
    }

    if (this.wamsg.type == MessageType.LIST_RESPONSE) {
      this.message.selected = this.wamsg.content || this.wamsg.body;
    }

    if (this.wamsg.type == MessageType.TEMPLATE_BUTTON_REPLY) {
      this.message.selected = this.wamsg.content || this.wamsg.body;
    }
  }

  public static async Read(wpp: WPPConnect, wamsg: model.Message) {
    const convert = new WPPMessage(wpp, wamsg);

    return await convert.read();
  }
}
