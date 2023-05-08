import { Message } from "@wppconnect-team/wppconnect";

/**
 * * Replace ID content
 * @param id
 */
export function replaceID(id: string): string {
  id = String(`${id}`).replace(/:(.*)@/, "@");

  if (id.includes("@s") || id.includes("@c")) id = id.split("@")[0];

  return id.trim();
}

/**
 * * Get ID content
 * @param id
 */
export function getID(id: string): string {
  id = String(`${id}`);

  if (!id.includes("@")) id = `${id}@c.us`;

  return id.trim();
}

/**
 * * ID is group format
 * @param id
 */
export function isGroupId(id: string): boolean {
  return id.includes("@g");
}

/**
 * * ID is private format
 * @param id
 */
export function isPvId(id: string): boolean {
  return !id.includes("@") || id.includes("@c") || id.includes("@s");
}

/** @returns ID do usuário que enviou a mensagem */
export function getUserFromMessage(message: any) {
  if (typeof message.sender == "string") {
    var id = `${message.sender}`;
  } else if (typeof message.sender.id == "string") {
    var id = `${message.sender.id}`;
  } else {
    var id = `${message.sender.id._serialized}`;
  }

  return replaceID(id);
}

/** @returns ID da sala de bate-papo que foi enviado a mensagem */
export function getChatFromMessage(message: any) {
  const chat: any = message.chatId;

  if (typeof chat == "string") {
    var id = `${chat}`;
  } else {
    var id = `${chat?._serialized}`;
  }

  return replaceID(id);
}

/** @returns ID da mensagem */
export function getMessageID(message: any) {
  const msgId: any = message.msgId;

  if (typeof msgId == "string") {
    var id = `${msgId}`;
  } else {
    var id = `${msgId?._serialized}`;
  }

  return id;
}
