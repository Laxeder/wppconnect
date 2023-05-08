"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rompot_1 = require("rompot");
const wppconnect_1 = require("@wppconnect-team/wppconnect");
const generic_1 = require("../utils/generic");
class WPPMessage {
    get waMsgAny() {
        return this.waMsg;
    }
    constructor(wpp, waMsg) {
        this.isValid = false;
        this.chat = new rompot_1.Chat("");
        this.user = new rompot_1.User("");
        this.message = new rompot_1.Message("", "");
        this.wpp = wpp;
        this.waMsg = waMsg;
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            const isValid = this.valid();
            this.isValid = isValid;
            if (!isValid) {
                this.message = new rompot_1.EmptyMessage();
                return;
            }
            yield this.readUser();
            yield this.readChat();
            yield this.readMessage();
            this.message.chat = this.chat;
            this.message.user = this.user;
            return this;
        });
    }
    valid() {
        if (!this.waMsg)
            return false;
        if (!this.waMsg.sender)
            return false;
        if (this.waMsg.type == wppconnect_1.MessageType.CHAT)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.LIST)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.AUDIO)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.IMAGE)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.VIDEO)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.VCARD)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.STICKER)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.DOCUMENT)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.LOCATION)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.MULTI_VCARD)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.LIST_RESPONSE)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.BUTTONS_RESPONSE)
            return true;
        if (this.waMsg.type == wppconnect_1.MessageType.TEMPLATE_BUTTON_REPLY)
            return true;
        return false;
    }
    readChat() {
        return __awaiter(this, void 0, void 0, function* () {
            const chatId = (0, generic_1.getChatFromMessage)(this.waMsg);
            const chat = new rompot_1.Chat(chatId);
            this.chat = (yield this.wpp.getChat(chat)) || chat;
            this.chat.id = chatId;
            this.chat.type = this.waMsg.isGroupMsg ? "group" : "pv";
            if (this.chat.type == "pv" && this.user.id != this.wpp.id) {
                this.chat.name = this.waMsg.sender.pushname || this.waMsg.sender.verifiedName || this.waMsg.sender.name || "";
            }
        });
    }
    readUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = (0, generic_1.getUserFromMessage)(this.waMsg);
            const user = new rompot_1.User((0, generic_1.replaceID)(userId));
            this.user = (yield this.wpp.getUser(user)) || user;
            this.user.id = (0, generic_1.replaceID)(userId);
            const name = this.waMsg.sender.pushname || this.waMsg.sender.verifiedName || this.waMsg.sender.name || "";
            if (!!name && this.user.name != name) {
                this.user.name = name;
            }
        });
    }
    readMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.readButtonMessage();
            yield this.readListMessage();
            yield this.readLocationMessage();
            yield this.readMediaMessage();
            yield this.readMentionMessage();
            this.message.id = this.waMsg.id;
            this.message.apiSend = this.message.id.includes("true");
            this.message.fromMe = (0, generic_1.getID)(this.waMsg.from) == (0, generic_1.getID)(this.wpp.id);
            this.message.timestamp = this.waMsg.timestamp;
            this.message.text = !!this.message.text ? this.message.text : this.waMsg.body || this.waMsg.content || "";
        });
    }
    readMentionMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.waMsg.quotedMsgId) {
                const mention = yield this.wpp.wcb.waitCall(() => this.wpp.client.getMessageById(this.waMsg.quotedMsgId));
                if (!!mention) {
                    const { message, isValid } = yield WPPMessage.Read(this.wpp, mention);
                    if (isValid)
                        this.message.mention = message;
                }
            }
        });
    }
    readMediaMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            const media = { stream: this.waMsgAny };
            if (this.waMsg.type == wppconnect_1.MessageType.DOCUMENT) {
                this.message = new rompot_1.FileMessage(this.chat, this.waMsgAny.caption || "", media);
            }
            if (this.waMsg.type == wppconnect_1.MessageType.IMAGE) {
                this.message = new rompot_1.ImageMessage(this.chat, this.waMsgAny.caption || "", media);
            }
            if (this.waMsg.type == wppconnect_1.MessageType.VIDEO) {
                this.message = new rompot_1.VideoMessage(this.chat, this.waMsgAny.caption || "", media);
            }
            if (this.waMsg.type == wppconnect_1.MessageType.STICKER) {
                this.message = new rompot_1.StickerMessage(this.chat, media);
            }
        });
    }
    readLocationMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.waMsg.type == wppconnect_1.MessageType.LOCATION) {
                this.message = new rompot_1.LocationMessage(this.chat, this.waMsgAny.lat, this.waMsgAny.lng);
            }
        });
    }
    readButtonMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: read button message
            if (this.waMsg.type == wppconnect_1.MessageType.BUTTONS_RESPONSE) {
                this.message.selected = this.waMsg.content || this.waMsg.body;
            }
            if (this.waMsg.type == wppconnect_1.MessageType.TEMPLATE_BUTTON_REPLY) {
                this.message.selected = this.waMsg.content || this.waMsg.body;
            }
        });
    }
    readListMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: read list message
            if (this.waMsg.type == wppconnect_1.MessageType.LIST_RESPONSE) {
                this.message.selected = this.waMsg.content || this.waMsg.body;
            }
        });
    }
    readContactMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.waMsg.type == wppconnect_1.MessageType.VCARD) {
            }
            if (this.waMsg.type == wppconnect_1.MessageType.MULTI_VCARD) {
            }
        });
    }
    static ReadPollResponse(wpp, waMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgId = (0, generic_1.getMessageID)(waMsg);
            const userId = (0, generic_1.getUserFromMessage)(waMsg);
            const chatId = (0, generic_1.getChatFromMessage)(waMsg);
            const chat = (yield wpp.getChat(new rompot_1.Chat(chatId))) || new rompot_1.Chat(chatId);
            chat.type = chatId.includes("@g") ? "group" : "pv";
            const pollUpdate = new rompot_1.PollUpdateMessage(chat, "");
            pollUpdate.user = (yield wpp.getUser(new rompot_1.User(userId))) || new rompot_1.User(userId);
            if (!wpp.polls.hasOwnProperty(msgId))
                return pollUpdate;
            const pollCreation = wpp.polls[msgId];
            if (!pollCreation)
                return pollUpdate;
            pollUpdate.text = pollCreation.text || "";
            if (!!!waMsg.selectedOptions)
                return pollUpdate;
            const votes = [];
            const votesAlias = {};
            for (const opt of waMsg.selectedOptions) {
                if (!!opt)
                    votes.push(opt.name);
            }
            const nowVotes = [];
            const oldVotes = pollCreation.getUserVotes(userId).sort();
            for (const opt of pollCreation.options) {
                votesAlias[opt.name] = opt;
                if (votes.includes(opt.name)) {
                    nowVotes.push(opt.name);
                }
            }
            let vote = null;
            for (const name of Object.keys(votesAlias)) {
                if (nowVotes.length > oldVotes.length) {
                    if (oldVotes.includes(name) || !nowVotes.includes(name))
                        continue;
                    vote = votesAlias[name];
                    pollUpdate.action = "add";
                    break;
                }
                else {
                    if (nowVotes.includes(name) || !oldVotes.includes(name))
                        continue;
                    vote = votesAlias[name];
                    pollUpdate.action = "remove";
                    break;
                }
            }
            pollUpdate.selected = (vote === null || vote === void 0 ? void 0 : vote.id) || (vote === null || vote === void 0 ? void 0 : vote.name) || "";
            pollUpdate.text = (vote === null || vote === void 0 ? void 0 : vote.name) || "";
            pollCreation.setUserVotes(userId, nowVotes);
            wpp.polls[pollCreation.id] = pollCreation;
            yield wpp.savePolls();
            return pollUpdate;
        });
    }
    static Read(wpp, waMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            const convert = new WPPMessage(wpp, waMsg);
            yield convert.read();
            return convert;
        });
    }
}
exports.default = WPPMessage;
//# sourceMappingURL=WPPMessage.js.map