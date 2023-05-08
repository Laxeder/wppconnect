/**
 * * Replace ID content
 * @param id
 */
export declare function replaceID(id: string): string;
/**
 * * Get ID content
 * @param id
 */
export declare function getID(id: string): string;
/**
 * * ID is group format
 * @param id
 */
export declare function isGroupId(id: string): boolean;
/**
 * * ID is private format
 * @param id
 */
export declare function isPvId(id: string): boolean;
/** @returns ID do usuário que enviou a mensagem */
export declare function getUserFromMessage(message: any): string;
/** @returns ID da sala de bate-papo que foi enviado a mensagem */
export declare function getChatFromMessage(message: any): string;
/** @returns ID da mensagem */
export declare function getMessageID(message: any): string;
