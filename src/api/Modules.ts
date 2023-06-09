import { Chat, ChatType, Message, User } from "rompot";

import type { WAUsers } from "../types";

export class WAUser extends User {
  /** * Nome */
  public name: string;
  /** * Descrição */
  public description: string;
  /** * Foto de perfil */
  public profile: Buffer;
  /** * É administrador */
  public isAdmin: boolean;
  /** É líder */
  public isLeader: boolean;

  constructor(id: string, name?: string, description?: string, profile?: Buffer) {
    super(id);

    this.name = name || "";
    this.description = description || "";
    this.profile = profile || Buffer.from("");
    this.isAdmin = false;
    this.isLeader = false;
  }
}

export class WAChat extends Chat {
  /** * Nome */
  public name: string;
  /** * Descrição */
  public description: string;
  /** * Foto de perfil */
  public profile: Buffer;
  /** * Usuários da sala de bate-papo */
  public users: WAUsers = {};

  constructor(id: string, type?: ChatType, name?: string, description?: string, profile?: Buffer, users?: WAUsers) {
    super(id, type);

    this.name = name || "";
    this.description = description || "";
    this.profile = profile || Buffer.from("");
    this.users = users || {};
  }
}

export class WAMessage extends Message {
  /** * Sala de bate-papo que foi enviada a mensagem */
  public chat: WAChat;
  /** * Usuário que mandou a mensagem */
  public user: WAUser;
  /** * Mensagem mencionada na mensagem */
  public mention?: WAMessage | undefined;

  constructor(chat: WAChat | string, text: string, mention?: WAMessage, id?: string, user?: WAUser | string, fromMe?: boolean, selected?: string, mentions?: string[], timestamp?: Number | Long) {
    super(chat, text, mention, id, user, fromMe, selected, mentions, timestamp);

    if (mention) this.mention = WAMessage.Client(this.client, mention);
  }
}
