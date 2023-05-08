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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rompot_1 = require("rompot");
const WPPMessage_1 = __importDefault(require("./WPPMessage"));
const generic_1 = require("../utils/generic");
class ConfigWPPEvents {
    constructor(wpp) {
        this.timesReconnecting = 10;
        this.wpp = wpp;
    }
    configure() {
        this.configStatusUpdate();
        this.configQREvent();
        this.configOnAnyMessage();
        this.configPollResponse();
        // this.configContactsUpdate();
        // this.configChatsUpsert();
        // this.configGroupsUpdate();
        // this.configChatsDelete();
    }
    configQREvent() {
        this.wpp.client.catchQR = (base64Qrimg, asciiQR) => {
            if (this.wpp.config.logQR)
                console.log(asciiQR);
            this.wpp.ev.emit("qr", base64Qrimg);
        };
    }
    configStatusUpdate() {
        this.wpp.client.statusFind = (status) => __awaiter(this, void 0, void 0, function* () {
            if (status == "inChat") {
                this.wpp.status = "online";
                this.wpp.id = (0, generic_1.replaceID)(yield this.wpp.client.getWid());
                yield this.wpp.readChats();
                yield this.wpp.readUsers();
                yield this.wpp.readPolls();
                this.wpp.ev.emit("open", { isNewLogin: false });
            }
            if (status == "browserClose" || status == "serverClose" || status == "autocloseCalled") {
                if (this.wpp.status == "online") {
                    this.wpp.status = "offline";
                    this.wpp.ev.emit("close", {});
                    if (this.wpp.config.timesForReconnect > this.timesReconnecting) {
                        ++this.timesReconnecting;
                        yield this.wpp.reconnect();
                    }
                }
            }
        });
    }
    configOnAnyMessage() {
        this.wpp.client.onAnyMessage((msg) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                if (!!!msg)
                    return;
                const { message, isValid } = yield WPPMessage_1.default.Read(this.wpp, msg);
                if (!isValid)
                    return;
                if (!!!message.chat.id)
                    return;
                if (message instanceof rompot_1.EmptyMessage)
                    return;
                if (message.chat.id.includes("status@broadcast"))
                    return;
                if (((_a = this.wpp.users[message.user.id]) === null || _a === void 0 ? void 0 : _a.name) != message.user.name) {
                    yield this.wpp.addUser(message.user);
                }
                if (((_b = this.wpp.chats[message.chat.id]) === null || _b === void 0 ? void 0 : _b.name) != message.chat.name) {
                    yield this.wpp.addChat(message.chat);
                }
                this.wpp.ev.emit("message", message);
            }
            catch (err) {
                this.wpp.ev.emit("error", err);
            }
        }));
    }
    configPollResponse() {
        this.wpp.client.onPollResponse((msg) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!!!msg)
                    return;
                const pollMessage = yield WPPMessage_1.default.ReadPollResponse(this.wpp, msg);
                if (!pollMessage)
                    return;
                this.wpp.ev.emit("message", pollMessage);
            }
            catch (err) {
                this.wpp.ev.emit("error", err);
            }
        }));
    }
}
exports.default = ConfigWPPEvents;
//# sourceMappingURL=Events.js.map