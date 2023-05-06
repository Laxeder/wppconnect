import type { WPPConnectOption } from "../types/default";
import type { WAChats, WAUsers } from "../types/modules";

import {
  BotEvents,
  Chat,
  ChatStatus,
  ConnectionStatus,
  getError,
  IAuth,
  IBot,
  injectJSON,
  Media,
  Message,
  MultiFileAuthState,
  PollMessage,
  ReactionMessage,
  User,
  UserAction,
  UserEvent,
  WaitCallBack,
  // AudioMessage,
} from "rompot";
import { create, Whatsapp } from "@wppconnect-team/wppconnect";

import MessageTranspiler from "@api/TranspileMessage";
import { WAChat, WAUser } from "@api/Modules";
import ConfigWPPEvents from "@api/Events";

import { getID, isGroupId, isPvId, replaceID } from "@utils/generic";
import { DEFAULT_CLIENT_OPTIONS } from "@utils/default";

export default class WPPConnect implements IBot {
  //@ts-ignore
  public client: Whatsapp = {};
  public ev: BotEvents = new BotEvents();
  public wcb: WaitCallBack = new WaitCallBack((err: any) => {
    if (typeof err == "object" && err.erro && err.text) err = err.text;

    this.ev.emit("error", getError(err));
  });

  public auth: IAuth = new MultiFileAuthState("./session");
  public config: WPPConnectOption = DEFAULT_CLIENT_OPTIONS;
  public configEvents: ConfigWPPEvents = new ConfigWPPEvents(this);

  public id: string = "";
  public sessionName: string = "";
  public status: ConnectionStatus = "offline";

  public users: WAUsers = {};
  public chats: WAChats = {};
  public polls: { [id: string]: PollMessage } = {};

  constructor(config?: Partial<WPPConnectOption>) {
    this.config = { ...DEFAULT_CLIENT_OPTIONS, ...config };
  }

  public async connect(auth?: string | IAuth): Promise<void> {
    return await new Promise(async (resolve, reject) => {
      try {
        if (!!!auth) auth = String("./session");

        // if (typeof auth == "string") {
        //   auth = new LocalAuth(auth);
        // }

        this.ev.emit("connecting", {});

        this.client = await create({
          ...this.config,
        });

        this.configEvents.configure();

        process.on("SIGINT", () => {
          this.ev.emit("close", {});
          this.client.close();
        });
      } catch (err) {
        this.ev.emit("error", getError(err));
      }
    });
  }

  public async reconnect(alert: boolean = true): Promise<any> {
    if (alert) this.ev.emit("reconnecting", {});

    await this.stop();

    return this.connect(this.auth);
  }

  public async stop(reason?: any): Promise<void> {
    if (this.status == "online") {
      this.status = "offline";

      await this.client.close();
    }
  }

  //! ********************************* AUTH *********************************

  /**
   * * Salva os chats salvos
   * @param chats Sala de bate-papos
   */
  public async saveChats(chats: any = this.chats) {
    await this.auth.set(`chats`, chats);
  }

  /**
   * * Salva os usuários salvos
   * @param users Usuários
   */
  public async saveUsers(users: any = this.users) {
    await this.auth.set(`users`, users);
  }

  /**
   * * Salva as mensagem de enquete salvas
   * @param polls Enquetes
   */
  public async savePolls(polls: any = this.polls) {
    await this.auth.set(`polls`, polls);
  }

  /**
   * * Obtem os chats salvos
   */
  public async readChats() {
    const chats: WAChat = (await this.auth.get(`chats`)) || {};

    for (const id of Object.keys(chats || {})) {
      const chat = chats[id];

      if (!!!chat) return;

      this.chats[id] = new WAChat(chat.id, chat.type, chat.name, chat.description, chat.profile);

      for (const userId of Object.keys(chat.users || {})) {
        const user = chat.users[userId];

        if (!!!user) continue;

        this.chats[id].users[userId] = new WAUser(user.id, user.name, user.description, user.profile);
        this.chats[id].users[userId].isAdmin = user.isAdmin;
        this.chats[id].users[userId].isLeader = user.isLeader;
      }
    }
  }

  /**
   * * Obtem os usuários salvos
   */
  public async readUsers() {
    const users: WAUsers = (await this.auth.get(`users`)) || {};

    for (const id of Object.keys(users || {})) {
      const user = users[id];

      if (!!!user) continue;

      this.users[id] = new WAUser(user.id, user.name, user.description, user.profile);
    }
  }

  /**
   * * Obtem as mensagem de enquete salvas
   */
  public async readPolls() {
    const polls: { [id: string]: PollMessage } = (await this.auth.get(`polls`)) || {};

    for (const id of Object.keys(polls || {})) {
      const poll = polls[id];

      if (!!!poll) continue;

      this.polls[id] = PollMessage.fromJSON(poll);
    }
  }

  /**
   * * Lê o chat
   * @param chat Sala de bate-papo
   */
  public async readChat(chat: Chat) {
    const newChat = new WAChat(replaceID(chat?.id || ""), isGroupId(chat?.id || "") ? "group" : "pv");

    const metadata = await this.wcb.waitCall(() => this.client.getChatById(getID(chat.id)));

    if (!!metadata) {
      if (!!metadata.name) newChat.name = metadata.name;
      if (!!metadata.groupMetadata?.desc) newChat.description = metadata.groupMetadata.desc;
    }

    if (!!newChat.id) await this.addChat(newChat);

    return newChat;
  }

  /**
   * * Lê o usuário
   * @param user Usuário
   * @param save Salva usuário lido
   */
  public async readUser(user: User) {
    const newUser = new WAUser(user?.id || "", user?.name || "");

    if (!!newUser.id) await this.addUser(newUser);

    return newUser;
  }

  /**
   * * Trata atualizações de participantes
   * @param action Ação realizada
   * @param chatId Sala de bate-papo que a ação foi realizada
   * @param userId Usuário que foi destinado a ação
   * @param fromId Usuário que realizou a ação
   */
  public async groupParticipantsUpdate(action: UserAction, chatId: string, userId: string, fromId: string) {
    const event: UserEvent = action == "join" ? "add" : action == "leave" ? "remove" : action;

    if (event == "remove" && replaceID(userId) == this.id) {
      //? Obtem possíveis dados inexistentes
      var chat = await this.getChat(new WAChat(replaceID(chatId)));
      var user = await this.getUser(new WAUser(replaceID(userId)));
      var fromUser = await this.getUser(new WAUser(replaceID(fromId)));
    } else {
      //? Obtem dados já existentes
      var chat = this.chats[replaceID(chatId)] || new WAChat(replaceID(chatId), chatId.includes("@g") ? "group" : "pv");
      var fromUser = this.chats[replaceID(chatId)]?.users[replaceID(fromId)] || new WAUser(replaceID(fromId));
      var user = this.chats[replaceID(chatId)]?.users[replaceID(userId)] || new WAUser(replaceID(userId));
    }

    if (!this.chats.hasOwnProperty(chat.id)) this.chats[chat.id] = chat;

    if (!this.chats[chat.id]?.users?.hasOwnProperty(user.id)) {
      this.chats[chat.id].users[user.id] = user;
    }

    if (event == "add") this.chats[chat.id].users[user.id] = user;
    if (event == "promote") this.chats[chat.id].users[user.id].isAdmin = true;
    if (event == "demote") this.chats[chat.id].users[user.id].isAdmin = false;

    await this.saveChats();

    if (event == "remove") {
      if (user.id == this.id) {
        delete this.chats[chat.id];

        await this.saveChats();

        this.ev.emit("chat", { action: "remove", chat });

        return;
      } else {
        delete this.chats[chat.id].users[user.id];
      }
    }

    this.ev.emit("user", { action, event, user, fromUser, chat });
  }

  //! ********************************* CHAT *********************************

  public async getChatName(chat: Chat) {
    return (await this.getChat(chat))?.name || (await this.getUser(User.get(chat.id)))?.name || "";
  }

  public async setChatName(chat: Chat, name: string) {
    if (isGroupId(chat.id)) {
      await this.wcb.waitCall(() => this.client.setGroupSubject(getID(chat.id), name));
    }

    if (isPvId(chat.id) && getID(chat.id) == getID(this.id)) {
      await this.wcb.waitCall(() => this.client.setProfileName(name));
    }
  }

  public async getChatDescription(chat: Chat) {
    return (await this.wcb.waitCall(() => this.client.getStatus(getID(chat.id))))?.status || "";
  }

  public async setChatDescription(chat: Chat, description: string): Promise<any> {
    if (isGroupId(chat.id)) {
      await this.wcb.waitCall(() => this.client.setGroupDescription(getID(chat.id), description));
    }

    if (isPvId(chat.id) && getID(chat.id) == getID(this.id)) {
      await this.wcb.waitCall(() => this.client.setProfileStatus(description));
    }
  }

  public async getChatProfile(chat: Chat) {
    const data = await this.wcb.waitCall(() => this.client.getProfilePicFromServer(getID(chat.id)));

    if (!data) return Buffer.from("");

    return Buffer.from(data.imgFull || data.img, "base64");
  }

  public async setChatProfile(chat: Chat, image: Buffer) {
    if (isGroupId(chat.id)) {
      await this.wcb.waitCall(() => this.client.setGroupIcon(getID(chat.id), image.toString("base64")));
    }

    if (isPvId(chat.id) && getID(chat.id) == getID(this.id)) {
      await this.wcb.waitCall(() => this.client.setProfilePic(image.toString("base64")));
    }
  }

  public async addChat(chat: Chat) {
    await this.setChat(chat);

    this.ev.emit("chat", { action: "add", chat: this.chats[replaceID(chat.id)] || chat });
  }

  public async removeChat(chat: Chat) {
    delete this.chats[chat.id];

    this.ev.emit("chat", { action: "remove", chat });

    this.saveChats();
  }

  public async getChat(chat: Chat): Promise<WAChat | null> {
    if (!this.chats[replaceID(chat.id)]) {
      const newChat = await this.readChat(chat);

      return newChat;
    }

    return this.chats[replaceID(chat.id)] || null;
  }

  public async setChat(chat: Chat) {
    if (chat.id.includes("status")) return;

    chat.id = replaceID(chat.id);

    if (chat.id.includes("@g")) chat.type = "group";
    if (!chat.id.includes("@")) chat.type = "pv";

    if (chat instanceof WAChat) {
      this.chats[chat.id] = new WAChat(chat.id, chat.type, chat.name, chat.description, chat.profile, chat.users);
    } else {
      this.chats[chat.id] = new WAChat(chat.id, chat.type);
    }

    await this.saveChats();
  }

  public async getChats(): Promise<WAChats> {
    return this.chats;
  }

  public async setChats(chats: WAChats) {
    this.chats = chats;
  }

  public async getChatUsers(chat: Chat): Promise<WAUsers> {
    const users: WAUsers = {};

    if (!this.chats.hasOwnProperty(chat.id)) return users;

    const datas = await this.wcb.waitCall(() => this.client.getGroupMembers(getID(chat.id)));

    if (!datas) return users;

    for (const data of datas) {
      const user = new WAUser(replaceID(data.id.user), data.name || data.pushname || data.verifiedName || "");

      await this.addUser(user);

      users[user.id] = user;
    }

    return users;
  }

  public async getChatAdmins(chat: Chat): Promise<WAUsers> {
    const users: WAUsers = {};

    const wins = await this.wcb.waitCall(() => this.client.getGroupAdmins(getID(chat.id)));

    if (!wins) return users;

    await Promise.all(
      wins.map(async (win) => {
        const user = await this.readUser(new User(replaceID(win.toJid())));

        users[user.id] = user;
      })
    );

    return users;
  }

  public async getChatLeader(chat: Chat): Promise<WAUser> {
    //TODO: obter lider
    const admins = await this.getChatAdmins(chat);

    const ids = Object.keys(admins);

    if (ids.length == 0) return new WAUser("");

    const user = admins[ids[0]];

    return user;
  }

  public async addUserInChat(chat: Chat, user: User) {
    if (!chat.id.includes("@g")) return;

    const bot = (await this.getChat(chat))?.users[this.id];

    if (!bot || !bot.isAdmin) return;

    const invites = await this.wcb.waitCall(() => this.client.addParticipant(getID(chat.id), [getID(user.id)]));

    if (!invites) return;

    for (const userId in Object.keys(invites)) {
      const { invite_code } = invites[userId];

      //TODO: Send invite message
    }
  }

  public async removeUserInChat(chat: Chat, user: User) {
    await this.wcb.waitCall(() => this.client.removeParticipant(getID(chat.id), [getID(user.id)]));
  }

  public async promoteUserInChat(chat: Chat, user: User): Promise<void> {
    await this.wcb.waitCall(() => this.client.promoteParticipant(getID(chat.id), [getID(user.id)]));
  }

  public async demoteUserInChat(chat: Chat, user: User): Promise<void> {
    await this.wcb.waitCall(() => this.client.demoteParticipant(getID(chat.id), [getID(user.id)]));
  }

  public async changeChatStatus(chat: Chat, status: ChatStatus): Promise<void> {
    if (status == "online") {
      await this.wcb.waitCall(() => this.client.setOnlinePresence(true));
    }

    if (status == "offline") {
      await this.wcb.waitCall(() => this.client.setOnlinePresence(false));
    }

    if (status == "reading") {
      await this.wcb.waitCall(() => this.client.sendSeen(getID(chat.id)));
    }

    if (status == "typing") {
      await this.wcb.waitCall(() => this.client.startTyping(getID(chat.id)));
    }

    if (status == "recording") {
      await this.wcb.waitCall(() => this.client.startRecording(getID(chat.id)));
    }
  }

  public async createChat(chat: Chat) {
    await this.wcb.waitCall(() => this.client.createGroup(chat.name || "", [getID(this.id)]));
  }

  public async leaveChat(chat: Chat): Promise<any> {
    await this.wcb.waitCall(() => this.client.leaveGroup(getID(chat.id)));

    this.removeChat(chat);
  }

  //! ******************************* USER *******************************

  public async getUserName(user: User) {
    return (await this.getChat(new WAChat(user.id)))?.name || "";
  }

  public async setUserName(user: User, name: string) {
    if (user.id == this.id) return;

    return this.setBotName(name);
  }

  public async getUserDescription(user: User) {
    return await this.getChatName(Chat.get(user.id));
  }

  public async setUserDescription(user: User, description: string): Promise<any> {
    if (user.id == this.id) return;

    return this.setBotDescription(description);
  }

  public async getUserProfile(user: User) {
    return await this.getChatProfile(new Chat(user.id));
  }

  public async setUserProfile(user: User, image: Buffer) {
    if (user.id == this.id) return;

    return this.setBotProfile(image);
  }

  public async getUser(user: User): Promise<WAUser | null> {
    let usr: User | WAUser | WAChat = this.chats[user.id] || this.users[user.id];

    if (!usr) {
      return await this.readUser(user);
    }

    return injectJSON(usr, new WAUser(usr.id)) || null;
  }

  public async setUser(user: User): Promise<void> {
    if (user instanceof WAUser) {
      this.users[user.id] = new WAUser(user.id, user.name, user.description, user.profile);
    } else {
      this.users[user.id] = new WAUser(user.id);
    }

    await this.saveUsers(this.users);
  }

  public async getUsers(): Promise<WAUsers> {
    const users: WAUsers = {};

    for (const id in this.chats) {
      const chat = this.chats[id];

      if (chat.type != "pv" || chat.id.includes("@")) continue;

      users[id] = new WAUser(chat.id, chat.name, chat.description, chat.profile);
    }

    return users;
  }

  public async setUsers(users: WAUsers): Promise<void> {
    for (const id in users) {
      this.setUser(users[id]);
    }
  }

  public async addUser(user: User) {
    await this.setUser(user);
  }

  public async removeUser(user: User) {
    delete this.chats[user.id];
  }

  public async blockUser(user: User) {
    await this.wcb.waitCall(() => this.client.blockContact(getID(user.id)));
  }

  public async unblockUser(user: User) {
    await this.wcb.waitCall(() => this.client.unblockContact(getID(user.id)));
  }

  //! ******************************** BOT ********************************

  public async getBotName() {
    return await this.getChatName(Chat.get(this.id));
  }

  public async setBotName(name: string) {
    await this.setChatName(Chat.get(this.id), name);
  }

  public async getBotDescription() {
    return this.getChatDescription(new Chat(this.id));
  }

  public async setBotDescription(description: string) {
    await this.setChatDescription(Chat.get(this.id), description);
  }

  public async getBotProfile() {
    return await this.getChatProfile(new Chat(this.id));
  }

  public async setBotProfile(image: Buffer) {
    await this.setChatProfile(Chat.get(this.id), image);
  }

  //! ******************************* MESSAGE *******************************

  public async readMessage(message: Message): Promise<void> {
    return await this.changeChatStatus(message.chat, "reading");
  }

  public async removeMessage(message: Message) {
    await this.wcb.waitCall(() => this.client.deleteMessage(getID(message.chat.id), message.id, true));
  }

  public async deleteMessage(message: Message) {
    await this.wcb.waitCall(() => this.client.deleteMessage(getID(message.chat.id), message.id, false));
  }

  public async addReaction(message: Message, reaction: string): Promise<void> {
    const reactionMessage = new ReactionMessage(message.chat, reaction, message);

    await MessageTranspiler.sendMessage(this, reactionMessage);
  }

  public async removeReaction(message: Message): Promise<void> {
    const reactionMessage = new ReactionMessage(message.chat, "", message);

    await MessageTranspiler.sendMessage(this, reactionMessage);
  }

  public async send(content: Message): Promise<Message> {
    const msgRes = await MessageTranspiler.sendMessage(this, content);

    //TODO: Add audio message
    // if (msgRes instanceof AudioMessage) {
    if (false) {
      await this.client.stopRecoring(getID(msgRes.chat.id));
    } else {
      await this.client.stopTyping(getID(msgRes.chat.id));
    }

    if (msgRes instanceof PollMessage && content instanceof PollMessage) {
      this.polls[msgRes.id] = msgRes;

      await this.savePolls(this.polls);
    }

    return msgRes;
  }

  public async downloadStreamMessage(media: Media): Promise<Buffer> {
    const base64 = await this.wcb.waitCall(() => this.client.downloadMedia(media.stream));

    return Buffer.from(base64 || "");
  }
}
