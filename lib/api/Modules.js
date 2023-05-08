"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAMessage = exports.WAChat = exports.WAUser = void 0;
const rompot_1 = require("rompot");
class WAUser extends rompot_1.User {
    constructor(id, name, description, profile) {
        super(id);
        this.name = name || "";
        this.description = description || "";
        this.profile = profile || Buffer.from("");
        this.isAdmin = false;
        this.isLeader = false;
    }
}
exports.WAUser = WAUser;
class WAChat extends rompot_1.Chat {
    constructor(id, type, name, description, profile, users) {
        super(id, type);
        /** * Usuários da sala de bate-papo */
        this.users = {};
        this.name = name || "";
        this.description = description || "";
        this.profile = profile || Buffer.from("");
        this.users = users || {};
    }
}
exports.WAChat = WAChat;
class WAMessage extends rompot_1.Message {
    constructor(chat, text, mention, id, user, fromMe, selected, mentions, timestamp) {
        super(chat, text, mention, id, user, fromMe, selected, mentions, timestamp);
        if (mention)
            this.mention = WAMessage.Client(this.client, mention);
    }
}
exports.WAMessage = WAMessage;
//# sourceMappingURL=Modules.js.map