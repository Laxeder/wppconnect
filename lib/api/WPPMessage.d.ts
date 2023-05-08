import type { PollMessageUpdateType } from "../types/messages";
import { Chat, Message, PollUpdateMessage, User } from "rompot";
import * as model from "@wppconnect-team/wppconnect/dist/api/model/message";
import WPPConnect from "./WPPConnect";
export default class WPPMessage {
    wpp: WPPConnect;
    waMsg: model.Message;
    isValid: boolean;
    chat: Chat;
    user: User;
    message: Message;
    get waMsgAny(): any;
    constructor(wpp: WPPConnect, waMsg: model.Message);
    read(): Promise<this>;
    valid(): boolean;
    readChat(): Promise<void>;
    readUser(): Promise<void>;
    readMessage(): Promise<void>;
    readMentionMessage(): Promise<void>;
    readMediaMessage(): Promise<void>;
    readLocationMessage(): Promise<void>;
    readButtonMessage(): Promise<void>;
    readListMessage(): Promise<void>;
    readContactMessage(): Promise<void>;
    static ReadPollResponse(wpp: WPPConnect, waMsg: PollMessageUpdateType): Promise<PollUpdateMessage>;
    static Read(wpp: WPPConnect, waMsg: model.Message): Promise<WPPMessage>;
}
