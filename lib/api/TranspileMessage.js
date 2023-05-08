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
const messages_1 = require("../enums/messages");
const generic_1 = require("../utils/generic");
class MessageTranspiler {
    constructor(wpp, message) {
        this.chat = "";
        this.content = "";
        this.media = "";
        this.quotedMsg = "";
        this.options = {};
        this.wpp = wpp;
        this.message = message;
        this.type = MessageTranspiler.getType(message);
        this.options = { detectMentioned: true };
    }
    transpile() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transpileChat();
            yield this.transpileContent();
            return this;
        });
    }
    transpileChat() {
        return __awaiter(this, void 0, void 0, function* () {
            this.chat = (0, generic_1.getID)(this.message.chat.id);
        });
    }
    transpileContent() {
        return __awaiter(this, void 0, void 0, function* () {
            this.content = this.message.text;
            this.options.mentionedList = this.message.mentions;
            const includesMention = yield this.transpileMention();
            const isPoll = yield this.transpilePollMessage();
            const isList = yield this.transpileListMessage();
            const isMedia = yield this.transpileMediaMessage();
            const isButton = yield this.transpileButtonMessage();
            const isContact = yield this.transpileContactMessage();
            const isReaction = yield this.transpileReactionMessage();
            const isLocation = yield this.transpileLocationMessage();
        });
    }
    transpileMention() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.message.mention)
                return false;
            this.options.quotedMsg = this.message.mention.id;
            this.quotedMsg = this.message.mention.id;
            return true;
        });
    }
    transpileMediaMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.message instanceof rompot_1.MediaMessage))
                return false;
            const stream = yield this.message.getStream();
            if (!stream || !Buffer.isBuffer(stream))
                return false;
            this.isGif = this.message.isGIF;
            if (this.message instanceof rompot_1.FileMessage) {
                this.type = messages_1.MessageTranspilerType.File;
                this.media = stream.toString();
            }
            if (this.message instanceof rompot_1.ImageMessage) {
                this.type = messages_1.MessageTranspilerType.Image;
                this.media = stream.toString();
            }
            if (this.message instanceof rompot_1.VideoMessage) {
                this.type = messages_1.MessageTranspilerType.Video;
                this.media = stream.toString();
            }
            if (this.message instanceof rompot_1.StickerMessage) {
                this.type = messages_1.MessageTranspilerType.Sticker;
                this.media = stream.toString();
            }
            return true;
        });
    }
    transpileLocationMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.message instanceof rompot_1.LocationMessage))
                return false;
            this.type = messages_1.MessageTranspilerType.Location;
            this.content = { lat: this.message.latitude, lng: this.message.longitude };
            return true;
        });
    }
    transpileContactMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.message instanceof rompot_1.ContactMessage))
                return false;
            const contacts = this.message.contacts.map((contact) => {
                return { id: contact.id, name: contact.name };
            });
            if (contacts.length < 2) {
                this.type = messages_1.MessageTranspilerType.Contact;
                if (contacts.length < 1)
                    contacts.push({ id: "", name: "" });
                this.content = contacts[0];
            }
            else {
                this.type = messages_1.MessageTranspilerType.ContactList;
                this.content = contacts;
            }
            return true;
        });
    }
    transpileReactionMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.message instanceof rompot_1.ReactionMessage))
                return false;
            this.type = messages_1.MessageTranspilerType.Reaction;
            this.content = { msgId: this.message.id, reaction: !!!this.message.text ? false : this.message.text };
            return true;
        });
    }
    transpilePollMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.message instanceof rompot_1.PollMessage))
                return false;
            this.type = messages_1.MessageTranspilerType.Poll;
            this.content = { name: this.message.text, choices: this.message.options.map((option) => option.name) };
            return true;
        });
    }
    transpileListMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.message instanceof rompot_1.ListMessage))
                return false;
            this.type = messages_1.MessageTranspilerType.List;
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
        });
    }
    transpileButtonMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(this.message instanceof rompot_1.ButtonMessage))
                return false;
            this.type = messages_1.MessageTranspilerType.Button;
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
        });
    }
    static sendMessage(wpp, message) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __awaiter(this, void 0, void 0, function* () {
            let { chat, type, content, options, media, isGif, isViewOnce, quotedMsg } = yield MessageTranspiler.Transpile(wpp, message);
            //? Fix values
            type = MessageTranspiler.getType(message);
            content = MessageTranspiler.getContent(type, content);
            if (type == messages_1.MessageTranspilerType.Text) {
                message.id = (_a = (yield wpp.wcb.waitCall(() => wpp.client.sendText(chat, content, options)))) === null || _a === void 0 ? void 0 : _a.id;
            }
            if (type == messages_1.MessageTranspilerType.File) {
                message.id = (_b = (yield wpp.wcb.waitCall(() => wpp.client.sendFile(chat, content, options)))) === null || _b === void 0 ? void 0 : _b.id;
            }
            if (type == messages_1.MessageTranspilerType.Video) {
                message.id = (_c = (yield wpp.wcb.waitCall(() => wpp.client.sendVideoAsGifFromBase64(chat, media, "", content, quotedMsg)))) === null || _c === void 0 ? void 0 : _c.id;
            }
            if (type == messages_1.MessageTranspilerType.Image) {
                message.id = (_d = (yield wpp.wcb.waitCall(() => wpp.client.sendImageFromBase64(chat, media, "", content, quotedMsg, isViewOnce)))) === null || _d === void 0 ? void 0 : _d.id;
            }
            if (type == messages_1.MessageTranspilerType.Sticker) {
                if (isGif) {
                    message.id = (_e = (yield wpp.wcb.waitCall(() => wpp.client.sendImageAsStickerGif(chat, media)))) === null || _e === void 0 ? void 0 : _e.id;
                }
                else {
                    message.id = (_f = (yield wpp.wcb.waitCall(() => wpp.client.sendImageAsSticker(chat, media)))) === null || _f === void 0 ? void 0 : _f.id;
                }
            }
            if (type == messages_1.MessageTranspilerType.Reaction) {
                message.id = (_g = (yield wpp.wcb.waitCall(() => wpp.client.sendReactionToMessage(content.msgId, content.reaction)))) === null || _g === void 0 ? void 0 : _g.sendMsgResult;
            }
            if (type == messages_1.MessageTranspilerType.Poll) {
                message.id = (_h = (yield wpp.wcb.waitCall(() => wpp.client.sendPollMessage(chat, content.name, content.choices)))) === null || _h === void 0 ? void 0 : _h.id;
                if (!!message.id && message instanceof rompot_1.PollMessage) {
                    wpp.polls[message.id] = message;
                    yield wpp.savePolls();
                }
            }
            if (type == messages_1.MessageTranspilerType.Contact) {
                message.id = (_j = (yield wpp.wcb.waitCall(() => wpp.client.sendContactVcard(chat, content.id, content.name)))) === null || _j === void 0 ? void 0 : _j.id;
            }
            if (type == messages_1.MessageTranspilerType.ContactList) {
                message.id = (_k = (yield wpp.wcb.waitCall(() => wpp.client.sendContactVcardList(chat, content)))) === null || _k === void 0 ? void 0 : _k.id;
            }
            if (type == messages_1.MessageTranspilerType.Button) {
                message.id = (_l = (yield wpp.wcb.waitCall(() => wpp.client.sendText(chat, content, options)))) === null || _l === void 0 ? void 0 : _l.id;
            }
            if (type == messages_1.MessageTranspilerType.List) {
                message.id = (_m = (yield wpp.wcb.waitCall(() => wpp.client.sendListMessage(chat, Object.assign(Object.assign({}, options), content))))) === null || _m === void 0 ? void 0 : _m.id;
            }
            return message;
        });
    }
    static getType(message) {
        if (message instanceof rompot_1.FileMessage)
            return messages_1.MessageTranspilerType.File;
        if (message instanceof rompot_1.ImageMessage)
            return messages_1.MessageTranspilerType.Image;
        if (message instanceof rompot_1.VideoMessage)
            return messages_1.MessageTranspilerType.Video;
        if (message instanceof rompot_1.StickerMessage)
            return messages_1.MessageTranspilerType.Sticker;
        if (message instanceof rompot_1.LocationMessage)
            return messages_1.MessageTranspilerType.Location;
        if (message instanceof rompot_1.ReactionMessage)
            return messages_1.MessageTranspilerType.Reaction;
        if (message instanceof rompot_1.ButtonMessage)
            return messages_1.MessageTranspilerType.Button;
        if (message instanceof rompot_1.ListMessage)
            return messages_1.MessageTranspilerType.List;
        if (message instanceof rompot_1.PollMessage)
            return messages_1.MessageTranspilerType.Poll;
        if (message instanceof rompot_1.ContactMessage) {
            if (message.contacts.length > 1)
                return messages_1.MessageTranspilerType.ContactList;
            return messages_1.MessageTranspilerType.Contact;
        }
        return messages_1.MessageTranspilerType.Text;
    }
    static getContent(type, content) {
        if (type == messages_1.MessageTranspilerType.Contact) {
            return { id: (content === null || content === void 0 ? void 0 : content.id) || "", name: (content === null || content === void 0 ? void 0 : content.name) || "" };
        }
        if (type == messages_1.MessageTranspilerType.ContactList) {
            return (Array.isArray(content) ? content : []);
        }
        if (type == messages_1.MessageTranspilerType.Reaction) {
            return { msgId: (content === null || content === void 0 ? void 0 : content.msgId) || "", reaction: (content === null || content === void 0 ? void 0 : content.reaction) || "" };
        }
        if (type == messages_1.MessageTranspilerType.Location) {
            return { lat: (content === null || content === void 0 ? void 0 : content.lat) || "", lng: (content === null || content === void 0 ? void 0 : content.lng) || "" };
        }
        if (type == messages_1.MessageTranspilerType.Poll) {
            return { name: (content === null || content === void 0 ? void 0 : content.name) || "", choices: (content === null || content === void 0 ? void 0 : content.choices) || [] };
        }
        if (type == messages_1.MessageTranspilerType.List) {
            return {
                buttonText: (content === null || content === void 0 ? void 0 : content.buttonText) || "",
                description: (content === null || content === void 0 ? void 0 : content.description) || "",
                title: (content === null || content === void 0 ? void 0 : content.title) || "",
                footer: (content === null || content === void 0 ? void 0 : content.footer) || "",
                sections: (content === null || content === void 0 ? void 0 : content.sections) || [],
            };
        }
        return content;
    }
    static Transpile(wpp, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const transpiler = new MessageTranspiler(wpp, message);
            yield transpiler.transpile();
            return transpiler;
        });
    }
}
exports.default = MessageTranspiler;
//# sourceMappingURL=TranspileMessage.js.map