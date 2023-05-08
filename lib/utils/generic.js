"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageID = exports.getChatFromMessage = exports.getUserFromMessage = exports.isPvId = exports.isGroupId = exports.getID = exports.replaceID = void 0;
/**
 * * Replace ID content
 * @param id
 */
function replaceID(id) {
    id = String(`${id}`).replace(/:(.*)@/, "@");
    if (id.includes("@s") || id.includes("@c"))
        id = id.split("@")[0];
    return id.trim();
}
exports.replaceID = replaceID;
/**
 * * Get ID content
 * @param id
 */
function getID(id) {
    id = String(`${id}`);
    if (!id.includes("@"))
        id = `${id}@c.us`;
    return id.trim();
}
exports.getID = getID;
/**
 * * ID is group format
 * @param id
 */
function isGroupId(id) {
    return id.includes("@g");
}
exports.isGroupId = isGroupId;
/**
 * * ID is private format
 * @param id
 */
function isPvId(id) {
    return !id.includes("@") || id.includes("@c") || id.includes("@s");
}
exports.isPvId = isPvId;
/** @returns ID do usuário que enviou a mensagem */
function getUserFromMessage(message) {
    if (typeof message.sender == "string") {
        var id = `${message.sender}`;
    }
    else if (typeof message.sender.id == "string") {
        var id = `${message.sender.id}`;
    }
    else {
        var id = `${message.sender.id._serialized}`;
    }
    return replaceID(id);
}
exports.getUserFromMessage = getUserFromMessage;
/** @returns ID da sala de bate-papo que foi enviado a mensagem */
function getChatFromMessage(message) {
    const chat = message.chatId;
    if (typeof chat == "string") {
        var id = `${chat}`;
    }
    else {
        var id = `${chat === null || chat === void 0 ? void 0 : chat._serialized}`;
    }
    return replaceID(id);
}
exports.getChatFromMessage = getChatFromMessage;
/** @returns ID da mensagem */
function getMessageID(message) {
    const msgId = message.msgId;
    if (typeof msgId == "string") {
        var id = `${msgId}`;
    }
    else {
        var id = `${msgId === null || msgId === void 0 ? void 0 : msgId._serialized}`;
    }
    return id;
}
exports.getMessageID = getMessageID;
//# sourceMappingURL=generic.js.map