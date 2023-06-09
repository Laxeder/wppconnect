import type { PollMessageUpdateType } from "../types/messages";

import { Chat, EmptyMessage, FileMessage, ImageMessage, LocationMessage, Media, Message, PollOption, PollUpdateMessage, StickerMessage, User, VideoMessage } from "rompot";
import * as model from "@wppconnect-team/wppconnect/dist/api/model/message";
import { MessageType } from "@wppconnect-team/wppconnect";

import WPPConnect from "@api/WPPConnect";

import { getChatFromMessage, getID, getMessageID, getUserFromMessage, replaceID } from "@utils/generic";

export default class WPPMessage {
  public wpp: WPPConnect;
  public waMsg: model.Message;

  public isValid: boolean = false;
  public chat: Chat = new Chat("");
  public user: User = new User("");
  public message: Message = new Message("", "");

  get waMsgAny(): any {
    return this.waMsg;
  }

  constructor(wpp: WPPConnect, waMsg: model.Message) {
    this.wpp = wpp;
    this.waMsg = waMsg;
  }

  public async read() {
    const isValid = this.valid();

    this.isValid = isValid;

    if (!isValid) {
      this.message = new EmptyMessage();
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
    if (!this.waMsg) return false;
    if (!this.waMsg.sender) return false;

    if (this.waMsg.type == MessageType.CHAT) return true;
    if (this.waMsg.type == MessageType.LIST) return true;
    if (this.waMsg.type == MessageType.AUDIO) return true;
    if (this.waMsg.type == MessageType.IMAGE) return true;
    if (this.waMsg.type == MessageType.VIDEO) return true;
    if (this.waMsg.type == MessageType.VCARD) return true;
    if (this.waMsg.type == MessageType.STICKER) return true;
    if (this.waMsg.type == MessageType.DOCUMENT) return true;
    if (this.waMsg.type == MessageType.LOCATION) return true;
    if (this.waMsg.type == MessageType.MULTI_VCARD) return true;
    if (this.waMsg.type == MessageType.LIST_RESPONSE) return true;
    if (this.waMsg.type == MessageType.BUTTONS_RESPONSE) return true;
    if (this.waMsg.type == MessageType.TEMPLATE_BUTTON_REPLY) return true;

    return false;
  }

  public async readChat() {
    const chatId = getChatFromMessage(this.waMsg);
    const chat = new Chat(chatId);

    this.chat = (await this.wpp.getChat(chat)) || chat;

    this.chat.id = chatId;
    this.chat.type = this.waMsg.isGroupMsg ? "group" : "pv";

    if (this.chat.type == "pv" && this.user.id != this.wpp.id) {
      this.chat.name = this.waMsg.sender.pushname || this.waMsg.sender.verifiedName || this.waMsg.sender.name || "";
    }
  }

  public async readUser() {
    const userId = getUserFromMessage(this.waMsg);
    const user = new User(replaceID(userId));

    this.user = (await this.wpp.getUser(user)) || user;

    this.user.id = replaceID(userId);

    const name = this.waMsg.sender.pushname || this.waMsg.sender.verifiedName || this.waMsg.sender.name || "";

    if (!!name && this.user.name != name) {
      this.user.name = name;
    }
  }

  public async readMessage() {
    await this.readButtonMessage();
    await this.readListMessage();
    await this.readLocationMessage();
    await this.readMediaMessage();
    await this.readMentionMessage();

    this.message.id = this.waMsg.id;
    this.message.fromMe = getID(this.waMsg.from) == getID(this.wpp.id);
    this.message.apiSend = this.wpp.sendedMessages.hasOwnProperty(this.waMsg.id);

    this.message.timestamp = this.waMsg.timestamp;
    this.message.text = !!this.message.text ? this.message.text : this.waMsg.body || this.waMsg.content || "";
  }

  public async readMentionMessage() {
    if (this.waMsg.quotedMsgId) {
      const mention = await this.wpp.wcb.waitCall(() => this.wpp.client.getMessageById(this.waMsg.quotedMsgId));

      if (!!mention) {
        const { message, isValid } = await WPPMessage.Read(this.wpp, mention);

        if (isValid) this.message.mention = message;
      }
    }
  }

  public async readMediaMessage() {
    const media: Media = { stream: this.waMsgAny };

    if (this.waMsg.type == MessageType.DOCUMENT) {
      this.message = new FileMessage(this.chat, this.waMsgAny.caption || "", media);
    }

    if (this.waMsg.type == MessageType.IMAGE) {
      this.message = new ImageMessage(this.chat, this.waMsgAny.caption || "", media);
    }

    if (this.waMsg.type == MessageType.VIDEO) {
      this.message = new VideoMessage(this.chat, this.waMsgAny.caption || "", media);
    }

    if (this.waMsg.type == MessageType.STICKER) {
      this.message = new StickerMessage(this.chat, media);
    }
  }

  public async readLocationMessage() {
    if (this.waMsg.type == MessageType.LOCATION) {
      this.message = new LocationMessage(this.chat, this.waMsgAny.lat, this.waMsgAny.lng);
    }
  }

  public async readButtonMessage() {
    //TODO: read button message

    if (this.waMsg.type == MessageType.BUTTONS_RESPONSE) {
      this.message.selected = this.waMsg.content || this.waMsg.body;
    }

    if (this.waMsg.type == MessageType.TEMPLATE_BUTTON_REPLY) {
      this.message.selected = this.waMsg.content || this.waMsg.body;
    }
  }

  public async readListMessage() {
    //TODO: read list message

    if (this.waMsg.type == MessageType.LIST_RESPONSE) {
      this.message.selected = this.waMsg.content || this.waMsg.body;
    }
  }

  public async readContactMessage() {
    if (this.waMsg.type == MessageType.VCARD) {
    }

    if (this.waMsg.type == MessageType.MULTI_VCARD) {
    }
  }

  public static async ReadPollResponse(wpp: WPPConnect, waMsg: PollMessageUpdateType) {
    const msgId = getMessageID(waMsg);

    const userId = getUserFromMessage(waMsg);

    const chatId = getChatFromMessage(waMsg);

    const chat = (await wpp.getChat(new Chat(chatId))) || new Chat(chatId);

    chat.type = chatId.includes("@g") ? "group" : "pv";

    const pollUpdate = new PollUpdateMessage(chat, "");

    pollUpdate.user = (await wpp.getUser(new User(userId))) || new User(userId);

    if (!wpp.polls.hasOwnProperty(msgId)) return pollUpdate;

    const pollCreation = wpp.polls[msgId];

    if (!pollCreation) return pollUpdate;

    pollUpdate.text = pollCreation.text || "";

    if (!!!waMsg.selectedOptions) return pollUpdate;

    const votes: string[] = [];
    const votesAlias: { [name: string]: PollOption } = {};

    for (const opt of waMsg.selectedOptions) {
      if (!!opt) votes.push(opt.name);
    }

    const nowVotes: string[] = [];
    const oldVotes: string[] = pollCreation.getUserVotes(userId).sort();

    for (const opt of pollCreation.options) {
      votesAlias[opt.name] = opt;

      if (votes.includes(opt.name)) {
        nowVotes.push(opt.name);
      }
    }

    let vote: PollOption | null = null;

    for (const name of Object.keys(votesAlias)) {
      if (nowVotes.length > oldVotes.length) {
        if (oldVotes.includes(name) || !nowVotes.includes(name)) continue;

        vote = votesAlias[name];

        pollUpdate.action = "add";

        break;
      } else {
        if (nowVotes.includes(name) || !oldVotes.includes(name)) continue;

        vote = votesAlias[name];

        pollUpdate.action = "remove";

        break;
      }
    }

    pollUpdate.selected = vote?.id || vote?.name || "";
    pollUpdate.text = vote?.name || "";

    pollCreation.setUserVotes(userId, nowVotes);

    wpp.polls[pollCreation.id] = pollCreation;

    await wpp.savePolls();

    return pollUpdate;
  }

  public static async Read(wpp: WPPConnect, waMsg: model.Message) {
    const convert = new WPPMessage(wpp, waMsg);

    await convert.read();

    return convert;
  }
}
