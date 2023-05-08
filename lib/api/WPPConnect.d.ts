/// <reference types="node" />
import type { WPPConnectOption } from "../types/default";
import type { WAChats, WAUsers } from "../types/modules";
import { BotEvents, Chat, ChatStatus, ConnectionStatus, IAuth, IBot, Media, Message, PollMessage, User, UserAction, WaitCallBack } from "rompot";
import { Whatsapp } from "@wppconnect-team/wppconnect";
import { WAChat, WAUser } from "./Modules";
import ConfigWPPEvents from "./Events";
export default class WPPConnect implements IBot {
    client: Whatsapp;
    ev: BotEvents;
    wcb: WaitCallBack;
    auth: IAuth;
    tokenStore: IAuth;
    config: WPPConnectOption;
    configEvents: ConfigWPPEvents;
    id: string;
    status: ConnectionStatus;
    users: WAUsers;
    chats: WAChats;
    polls: {
        [id: string]: PollMessage;
    };
    constructor(config?: Partial<WPPConnectOption>);
    connect(auth?: string | IAuth): Promise<void>;
    reconnect(alert?: boolean): Promise<any>;
    stop(reason?: any): Promise<void>;
    /**
     * * Salva os chats salvos
     * @param chats Sala de bate-papos
     */
    saveChats(chats?: any): Promise<void>;
    /**
     * * Salva os usuários salvos
     * @param users Usuários
     */
    saveUsers(users?: any): Promise<void>;
    /**
     * * Salva as mensagem de enquete salvas
     * @param polls Enquetes
     */
    savePolls(polls?: any): Promise<void>;
    /**
     * * Obtem os chats salvos
     */
    readChats(): Promise<void>;
    /**
     * * Obtem os usuários salvos
     */
    readUsers(): Promise<void>;
    /**
     * * Obtem as mensagem de enquete salvas
     */
    readPolls(): Promise<void>;
    /**
     * * Lê o chat
     * @param chat Sala de bate-papo
     */
    readChat(chat: Chat): Promise<WAChat>;
    /**
     * * Lê o usuário
     * @param user Usuário
     * @param save Salva usuário lido
     */
    readUser(user: User): Promise<WAUser>;
    /**
     * * Trata atualizações de participantes
     * @param action Ação realizada
     * @param chatId Sala de bate-papo que a ação foi realizada
     * @param userId Usuário que foi destinado a ação
     * @param fromId Usuário que realizou a ação
     */
    groupParticipantsUpdate(action: UserAction, chatId: string, userId: string, fromId: string): Promise<void>;
    getChatName(chat: Chat): Promise<string>;
    setChatName(chat: Chat, name: string): Promise<void>;
    getChatDescription(chat: Chat): Promise<string>;
    setChatDescription(chat: Chat, description: string): Promise<any>;
    getChatProfile(chat: Chat): Promise<Buffer>;
    setChatProfile(chat: Chat, image: Buffer): Promise<void>;
    addChat(chat: Chat): Promise<void>;
    removeChat(chat: Chat): Promise<void>;
    getChat(chat: Chat): Promise<WAChat | null>;
    setChat(chat: Chat): Promise<void>;
    getChats(): Promise<WAChats>;
    setChats(chats: WAChats): Promise<void>;
    getChatUsers(chat: Chat): Promise<WAUsers>;
    getChatAdmins(chat: Chat): Promise<WAUsers>;
    getChatLeader(chat: Chat): Promise<WAUser>;
    addUserInChat(chat: Chat, user: User): Promise<void>;
    removeUserInChat(chat: Chat, user: User): Promise<void>;
    promoteUserInChat(chat: Chat, user: User): Promise<void>;
    demoteUserInChat(chat: Chat, user: User): Promise<void>;
    changeChatStatus(chat: Chat, status: ChatStatus): Promise<void>;
    createChat(chat: Chat): Promise<void>;
    leaveChat(chat: Chat): Promise<any>;
    getUserName(user: User): Promise<string>;
    setUserName(user: User, name: string): Promise<void>;
    getUserDescription(user: User): Promise<string>;
    setUserDescription(user: User, description: string): Promise<any>;
    getUserProfile(user: User): Promise<Buffer>;
    setUserProfile(user: User, image: Buffer): Promise<void>;
    getUser(user: User): Promise<WAUser | null>;
    setUser(user: User): Promise<void>;
    getUsers(): Promise<WAUsers>;
    setUsers(users: WAUsers): Promise<void>;
    addUser(user: User): Promise<void>;
    removeUser(user: User): Promise<void>;
    blockUser(user: User): Promise<void>;
    unblockUser(user: User): Promise<void>;
    getBotName(): Promise<string>;
    setBotName(name: string): Promise<void>;
    getBotDescription(): Promise<string>;
    setBotDescription(description: string): Promise<void>;
    getBotProfile(): Promise<Buffer>;
    setBotProfile(image: Buffer): Promise<void>;
    readMessage(message: Message): Promise<void>;
    removeMessage(message: Message): Promise<void>;
    deleteMessage(message: Message): Promise<void>;
    addReaction(message: Message, reaction: string): Promise<void>;
    removeReaction(message: Message): Promise<void>;
    send(content: Message): Promise<Message>;
    downloadStreamMessage(media: Media): Promise<Buffer>;
}
