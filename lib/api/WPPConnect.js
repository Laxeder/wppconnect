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
const wppconnect_1 = require("@wppconnect-team/wppconnect");
const Auth_1 = require("./Auth");
const TranspileMessage_1 = __importDefault(require("./TranspileMessage"));
const Modules_1 = require("./Modules");
const Events_1 = __importDefault(require("./Events"));
const generic_1 = require("../utils/generic");
const default_1 = require("../utils/default");
class WPPConnect {
    constructor(config) {
        //@ts-ignore
        this.client = {};
        this.ev = new rompot_1.BotEvents();
        this.wcb = new rompot_1.WaitCallBack((err) => {
            if (typeof err == "object" && err.erro && err.text)
                err = err.text;
            this.ev.emit("error", (0, rompot_1.getError)(err));
        });
        this.auth = new rompot_1.MultiFileAuthState("./session");
        this.tokenStore = new Auth_1.WPPFileAuth({ path: "session" });
        this.config = default_1.DEFAULT_CLIENT_OPTIONS;
        this.configEvents = new Events_1.default(this);
        this.id = "";
        this.status = "offline";
        this.users = {};
        this.chats = {};
        this.polls = {};
        this.sendedMessages = {};
        this.config = Object.assign(Object.assign({}, default_1.DEFAULT_CLIENT_OPTIONS), config);
    }
    connect(auth) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!!!auth)
                        auth = String(this.config.folderNameToken || "");
                    if (typeof auth == "string") {
                        auth = new Auth_1.WPPFileAuth({ path: auth });
                    }
                    this.tokenStore = auth;
                    this.auth = new rompot_1.MultiFileAuthState(`${this.config.folderNameToken}/${this.config.session}`);
                    const tokenStore = (0, Auth_1.getTokenStore)(this.auth);
                    this.ev.emit("connecting", {});
                    this.client = yield (0, wppconnect_1.create)(Object.assign(Object.assign({}, this.config), { tokenStore }));
                    this.configEvents.configure();
                    process.on("SIGINT", () => {
                        this.ev.emit("close", {});
                        this.client.close();
                    });
                }
                catch (err) {
                    this.ev.emit("error", (0, rompot_1.getError)(err));
                }
            }));
        });
    }
    reconnect(alert = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (alert)
                this.ev.emit("reconnecting", {});
            yield this.stop();
            return this.connect(this.auth);
        });
    }
    stop(reason) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status == "online") {
                this.status = "offline";
                yield this.client.close();
            }
        });
    }
    //! ********************************* AUTH *********************************
    /**
     * * Salva os chats salvos
     * @param chats Sala de bate-papos
     */
    saveChats(chats = this.chats) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.auth.set(`chats`, chats);
        });
    }
    /**
     * * Salva os usuários salvos
     * @param users Usuários
     */
    saveUsers(users = this.users) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.auth.set(`users`, users);
        });
    }
    /**
     * * Salva as mensagem de enquete salvas
     * @param polls Enquetes
     */
    savePolls(polls = this.polls) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.auth.set(`polls`, polls);
        });
    }
    /**
     * * Salva as mensagens enviadas salvas
     * @param messages Mensagens enviadas
     */
    saveSendedMessages(messages = this.sendedMessages) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.auth.set(`sendedMessages`, messages);
        });
    }
    /**
     * * Obtem os chats salvos
     */
    readChats() {
        return __awaiter(this, void 0, void 0, function* () {
            const chats = (yield this.auth.get(`chats`)) || {};
            for (const id of Object.keys(chats || {})) {
                const chat = chats[id];
                if (!!!chat)
                    return;
                this.chats[id] = new Modules_1.WAChat(chat.id, chat.type, chat.name, chat.description, chat.profile);
                for (const userId of Object.keys(chat.users || {})) {
                    const user = chat.users[userId];
                    if (!!!user)
                        continue;
                    this.chats[id].users[userId] = new Modules_1.WAUser(user.id, user.name, user.description, user.profile);
                    this.chats[id].users[userId].isAdmin = user.isAdmin;
                    this.chats[id].users[userId].isLeader = user.isLeader;
                }
            }
        });
    }
    /**
     * * Obtem os usuários salvos
     */
    readUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = (yield this.auth.get(`users`)) || {};
            for (const id of Object.keys(users || {})) {
                const user = users[id];
                if (!!!user)
                    continue;
                this.users[id] = new Modules_1.WAUser(user.id, user.name, user.description, user.profile);
            }
        });
    }
    /**
     * * Obtem as mensagem de enquete salvas
     */
    readPolls() {
        return __awaiter(this, void 0, void 0, function* () {
            const polls = (yield this.auth.get(`polls`)) || {};
            for (const id of Object.keys(polls || {})) {
                const poll = polls[id];
                if (!!!poll)
                    continue;
                this.polls[id] = rompot_1.PollMessage.fromJSON(poll);
            }
        });
    }
    /**
     * * Obtem as mensagem enviadas salvas
     */
    readSendedMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = (yield this.auth.get(`sendedMessages`)) || {};
            for (const id of Object.keys(messages || {})) {
                const msg = messages[id];
                if (!!!msg)
                    continue;
                this.sendedMessages[id] = (0, rompot_1.injectJSON)(msg, new rompot_1.Message("", ""));
            }
        });
    }
    /**
     * * Lê o chat
     * @param chat Sala de bate-papo
     */
    readChat(chat) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const newChat = new Modules_1.WAChat((0, generic_1.replaceID)((chat === null || chat === void 0 ? void 0 : chat.id) || ""), (0, generic_1.isGroupId)((chat === null || chat === void 0 ? void 0 : chat.id) || "") ? "group" : "pv");
            const metadata = yield this.wcb.waitCall(() => this.client.getChatById((0, generic_1.getID)(chat.id)));
            if (!!metadata) {
                if (!!metadata.name)
                    newChat.name = metadata.name;
                if (!!((_a = metadata.groupMetadata) === null || _a === void 0 ? void 0 : _a.desc))
                    newChat.description = metadata.groupMetadata.desc;
            }
            if (!!newChat.id)
                yield this.addChat(newChat);
            return newChat;
        });
    }
    /**
     * * Lê o usuário
     * @param user Usuário
     * @param save Salva usuário lido
     */
    readUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const newUser = new Modules_1.WAUser((user === null || user === void 0 ? void 0 : user.id) || "", (user === null || user === void 0 ? void 0 : user.name) || "");
            if (!!newUser.id)
                yield this.addUser(newUser);
            return newUser;
        });
    }
    /**
     * * Trata atualizações de participantes
     * @param action Ação realizada
     * @param chatId Sala de bate-papo que a ação foi realizada
     * @param userId Usuário que foi destinado a ação
     * @param fromId Usuário que realizou a ação
     */
    groupParticipantsUpdate(action, chatId, userId, fromId) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const event = action == "join" ? "add" : action == "leave" ? "remove" : action;
            if (event == "remove" && (0, generic_1.replaceID)(userId) == this.id) {
                //? Obtem possíveis dados inexistentes
                var chat = yield this.getChat(new Modules_1.WAChat((0, generic_1.replaceID)(chatId)));
                var user = yield this.getUser(new Modules_1.WAUser((0, generic_1.replaceID)(userId)));
                var fromUser = yield this.getUser(new Modules_1.WAUser((0, generic_1.replaceID)(fromId)));
            }
            else {
                //? Obtem dados já existentes
                var chat = this.chats[(0, generic_1.replaceID)(chatId)] || new Modules_1.WAChat((0, generic_1.replaceID)(chatId), chatId.includes("@g") ? "group" : "pv");
                var fromUser = ((_a = this.chats[(0, generic_1.replaceID)(chatId)]) === null || _a === void 0 ? void 0 : _a.users[(0, generic_1.replaceID)(fromId)]) || new Modules_1.WAUser((0, generic_1.replaceID)(fromId));
                var user = ((_b = this.chats[(0, generic_1.replaceID)(chatId)]) === null || _b === void 0 ? void 0 : _b.users[(0, generic_1.replaceID)(userId)]) || new Modules_1.WAUser((0, generic_1.replaceID)(userId));
            }
            if (!this.chats.hasOwnProperty(chat.id))
                this.chats[chat.id] = chat;
            if (!((_d = (_c = this.chats[chat.id]) === null || _c === void 0 ? void 0 : _c.users) === null || _d === void 0 ? void 0 : _d.hasOwnProperty(user.id))) {
                this.chats[chat.id].users[user.id] = user;
            }
            if (event == "add")
                this.chats[chat.id].users[user.id] = user;
            if (event == "promote")
                this.chats[chat.id].users[user.id].isAdmin = true;
            if (event == "demote")
                this.chats[chat.id].users[user.id].isAdmin = false;
            yield this.saveChats();
            if (event == "remove") {
                if (user.id == this.id) {
                    delete this.chats[chat.id];
                    yield this.saveChats();
                    this.ev.emit("chat", { action: "remove", chat });
                    return;
                }
                else {
                    delete this.chats[chat.id].users[user.id];
                }
            }
            this.ev.emit("user", { action, event, user, fromUser, chat });
        });
    }
    //! ********************************* CHAT *********************************
    getChatName(chat) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return ((_a = (yield this.getChat(chat))) === null || _a === void 0 ? void 0 : _a.name) || ((_b = (yield this.getUser(rompot_1.User.get(chat.id)))) === null || _b === void 0 ? void 0 : _b.name) || "";
        });
    }
    setChatName(chat, name) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, generic_1.isGroupId)(chat.id)) {
                yield this.wcb.waitCall(() => this.client.setGroupSubject((0, generic_1.getID)(chat.id), name));
            }
            if ((0, generic_1.isPvId)(chat.id) && (0, generic_1.getID)(chat.id) == (0, generic_1.getID)(this.id)) {
                yield this.wcb.waitCall(() => this.client.setProfileName(name));
            }
        });
    }
    getChatDescription(chat) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            return ((_a = (yield this.wcb.waitCall(() => this.client.getStatus((0, generic_1.getID)(chat.id))))) === null || _a === void 0 ? void 0 : _a.status) || "";
        });
    }
    setChatDescription(chat, description) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, generic_1.isGroupId)(chat.id)) {
                yield this.wcb.waitCall(() => this.client.setGroupDescription((0, generic_1.getID)(chat.id), description));
            }
            if ((0, generic_1.isPvId)(chat.id) && (0, generic_1.getID)(chat.id) == (0, generic_1.getID)(this.id)) {
                yield this.wcb.waitCall(() => this.client.setProfileStatus(description));
            }
        });
    }
    getChatProfile(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.wcb.waitCall(() => this.client.getProfilePicFromServer((0, generic_1.getID)(chat.id)));
            if (!data)
                return Buffer.from("");
            return Buffer.from(data.imgFull || data.img, "base64");
        });
    }
    setChatProfile(chat, image) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, generic_1.isGroupId)(chat.id)) {
                yield this.wcb.waitCall(() => this.client.setGroupIcon((0, generic_1.getID)(chat.id), image.toString("base64")));
            }
            if ((0, generic_1.isPvId)(chat.id) && (0, generic_1.getID)(chat.id) == (0, generic_1.getID)(this.id)) {
                yield this.wcb.waitCall(() => this.client.setProfilePic(image.toString("base64")));
            }
        });
    }
    addChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setChat(chat);
            this.ev.emit("chat", { action: "add", chat: this.chats[(0, generic_1.replaceID)(chat.id)] || chat });
        });
    }
    removeChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            delete this.chats[chat.id];
            this.ev.emit("chat", { action: "remove", chat });
            this.saveChats();
        });
    }
    getChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.chats[(0, generic_1.replaceID)(chat.id)]) {
                const newChat = yield this.readChat(chat);
                return newChat;
            }
            return this.chats[(0, generic_1.replaceID)(chat.id)] || null;
        });
    }
    setChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            if (chat.id.includes("status"))
                return;
            chat.id = (0, generic_1.replaceID)(chat.id);
            if (chat.id.includes("@g"))
                chat.type = "group";
            if (!chat.id.includes("@"))
                chat.type = "pv";
            if (chat instanceof Modules_1.WAChat) {
                this.chats[chat.id] = new Modules_1.WAChat(chat.id, chat.type, chat.name, chat.description, chat.profile, chat.users);
            }
            else {
                this.chats[chat.id] = new Modules_1.WAChat(chat.id, chat.type);
            }
            yield this.saveChats();
        });
    }
    getChats() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.chats;
        });
    }
    setChats(chats) {
        return __awaiter(this, void 0, void 0, function* () {
            this.chats = chats;
        });
    }
    getChatUsers(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = {};
            if (!this.chats.hasOwnProperty(chat.id))
                return users;
            const datas = yield this.wcb.waitCall(() => this.client.getGroupMembers((0, generic_1.getID)(chat.id)));
            if (!datas)
                return users;
            for (const data of datas) {
                const user = new Modules_1.WAUser((0, generic_1.replaceID)(data.id.user), data.name || data.pushname || data.verifiedName || "");
                yield this.addUser(user);
                users[user.id] = user;
            }
            return users;
        });
    }
    getChatAdmins(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = {};
            const wins = yield this.wcb.waitCall(() => this.client.getGroupAdmins((0, generic_1.getID)(chat.id)));
            if (!wins)
                return users;
            yield Promise.all(wins.map((win) => __awaiter(this, void 0, void 0, function* () {
                const user = yield this.readUser(new rompot_1.User((0, generic_1.replaceID)(win.toJid())));
                users[user.id] = user;
            })));
            return users;
        });
    }
    getChatLeader(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: obter lider
            const admins = yield this.getChatAdmins(chat);
            const ids = Object.keys(admins);
            if (ids.length == 0)
                return new Modules_1.WAUser("");
            const user = admins[ids[0]];
            return user;
        });
    }
    addUserInChat(chat, user) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!chat.id.includes("@g"))
                return;
            const bot = (_a = (yield this.getChat(chat))) === null || _a === void 0 ? void 0 : _a.users[this.id];
            if (!bot || !bot.isAdmin)
                return;
            const invites = yield this.wcb.waitCall(() => this.client.addParticipant((0, generic_1.getID)(chat.id), [(0, generic_1.getID)(user.id)]));
            if (!invites)
                return;
            for (const userId in Object.keys(invites)) {
                const { invite_code } = invites[userId];
                //TODO: Send invite message
            }
        });
    }
    removeUserInChat(chat, user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.removeParticipant((0, generic_1.getID)(chat.id), [(0, generic_1.getID)(user.id)]));
        });
    }
    promoteUserInChat(chat, user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.promoteParticipant((0, generic_1.getID)(chat.id), [(0, generic_1.getID)(user.id)]));
        });
    }
    demoteUserInChat(chat, user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.demoteParticipant((0, generic_1.getID)(chat.id), [(0, generic_1.getID)(user.id)]));
        });
    }
    changeChatStatus(chat, status) {
        return __awaiter(this, void 0, void 0, function* () {
            if (status == "online") {
                yield this.wcb.waitCall(() => this.client.setOnlinePresence(true));
            }
            if (status == "offline") {
                yield this.wcb.waitCall(() => this.client.setOnlinePresence(false));
            }
            if (status == "reading") {
                yield this.wcb.waitCall(() => this.client.sendSeen((0, generic_1.getID)(chat.id)));
            }
            if (status == "typing") {
                yield this.wcb.waitCall(() => this.client.startTyping((0, generic_1.getID)(chat.id)));
            }
            if (status == "recording") {
                yield this.wcb.waitCall(() => this.client.startRecording((0, generic_1.getID)(chat.id)));
            }
        });
    }
    createChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.createGroup(chat.name || "", [(0, generic_1.getID)(this.id)]));
        });
    }
    leaveChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.leaveGroup((0, generic_1.getID)(chat.id)));
            this.removeChat(chat);
        });
    }
    //! ******************************* USER *******************************
    getUserName(user) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            return ((_a = (yield this.getChat(new Modules_1.WAChat(user.id)))) === null || _a === void 0 ? void 0 : _a.name) || "";
        });
    }
    setUserName(user, name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user.id == this.id)
                return;
            return this.setBotName(name);
        });
    }
    getUserDescription(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getChatName(rompot_1.Chat.get(user.id));
        });
    }
    setUserDescription(user, description) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user.id == this.id)
                return;
            return this.setBotDescription(description);
        });
    }
    getUserProfile(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getChatProfile(new rompot_1.Chat(user.id));
        });
    }
    setUserProfile(user, image) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user.id == this.id)
                return;
            return this.setBotProfile(image);
        });
    }
    getUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            let usr = this.chats[user.id] || this.users[user.id];
            if (!usr) {
                return yield this.readUser(user);
            }
            return (0, rompot_1.injectJSON)(usr, new Modules_1.WAUser(usr.id)) || null;
        });
    }
    setUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user instanceof Modules_1.WAUser) {
                this.users[user.id] = new Modules_1.WAUser(user.id, user.name, user.description, user.profile);
            }
            else {
                this.users[user.id] = new Modules_1.WAUser(user.id);
            }
            yield this.saveUsers(this.users);
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = {};
            for (const id in this.chats) {
                const chat = this.chats[id];
                if (chat.type != "pv" || chat.id.includes("@"))
                    continue;
                users[id] = new Modules_1.WAUser(chat.id, chat.name, chat.description, chat.profile);
            }
            return users;
        });
    }
    setUsers(users) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const id in users) {
                this.setUser(users[id]);
            }
        });
    }
    addUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setUser(user);
        });
    }
    removeUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            delete this.chats[user.id];
        });
    }
    blockUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.blockContact((0, generic_1.getID)(user.id)));
        });
    }
    unblockUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.unblockContact((0, generic_1.getID)(user.id)));
        });
    }
    //! ******************************** BOT ********************************
    getBotName() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getChatName(rompot_1.Chat.get(this.id));
        });
    }
    setBotName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setChatName(rompot_1.Chat.get(this.id), name);
        });
    }
    getBotDescription() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getChatDescription(new rompot_1.Chat(this.id));
        });
    }
    setBotDescription(description) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setChatDescription(rompot_1.Chat.get(this.id), description);
        });
    }
    getBotProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getChatProfile(new rompot_1.Chat(this.id));
        });
    }
    setBotProfile(image) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setChatProfile(rompot_1.Chat.get(this.id), image);
        });
    }
    //! ******************************* MESSAGE *******************************
    /**
     * * Adiciona uma mensagem na lista de mensagens enviadas
     * @param message Mensagem que será adicionada
     */
    addSendedMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof message != "object" || !message || !!!message.id)
                return;
            message.apiSend = true;
            this.sendedMessages[message.id] = message;
            yield this.saveSendedMessages();
        });
    }
    /**
     * * Remove uma mensagem da lista de mensagens enviadas
     * @param message Mensagem que será removida
     */
    removeMessageIgnore(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.sendedMessages.hasOwnProperty(message.id)) {
                delete this.sendedMessages[message.id];
            }
            yield this.saveSendedMessages();
        });
    }
    readMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.changeChatStatus(message.chat, "reading");
        });
    }
    removeMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.deleteMessage((0, generic_1.getID)(message.chat.id), message.id, true));
        });
    }
    deleteMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.wcb.waitCall(() => this.client.deleteMessage((0, generic_1.getID)(message.chat.id), message.id, false));
        });
    }
    addReaction(message, reaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const reactionMessage = new rompot_1.ReactionMessage(message.chat, reaction, message);
            yield TranspileMessage_1.default.sendMessage(this, reactionMessage);
        });
    }
    removeReaction(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const reactionMessage = new rompot_1.ReactionMessage(message.chat, "", message);
            yield TranspileMessage_1.default.sendMessage(this, reactionMessage);
        });
    }
    send(content) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgRes = yield TranspileMessage_1.default.sendMessage(this, content);
            yield this.addSendedMessage(msgRes);
            if (msgRes instanceof rompot_1.PollMessage) {
                this.polls[msgRes.id] = msgRes;
                yield this.savePolls(this.polls);
            }
            if (msgRes instanceof rompot_1.AudioMessage) {
                yield this.client.stopRecoring((0, generic_1.getID)(msgRes.chat.id));
            }
            else {
                yield this.client.stopTyping((0, generic_1.getID)(msgRes.chat.id));
            }
            return msgRes;
        });
    }
    downloadStreamMessage(media) {
        return __awaiter(this, void 0, void 0, function* () {
            const base64 = yield this.wcb.waitCall(() => this.client.downloadMedia(media.stream));
            return Buffer.from(base64 || "");
        });
    }
}
exports.default = WPPConnect;
//# sourceMappingURL=WPPConnect.js.map