import { Wid } from "@wppconnect-team/wppconnect";
export declare type ReactionMessageTranspiled = {
    msgId: string;
    reaction: string;
};
export declare type LocationMessageTranspiled = {
    lat: string;
    lng: string;
};
export declare type PollMessaeTranspiled = {
    name: string;
    choices: string[];
};
export declare type ReactMessageResponseType = {
    id: string;
    msgId: string;
    reactionText: string;
    read: boolean;
    orphan: number;
    orphanReason: any;
    timestamp: number;
};
export declare type PollMessageUpdateType = {
    msgId: string;
    chatId: Wid;
    selectedOptions: Array<{
        name: string;
        localId: number;
    } | null>;
    timestamp: number;
    sender: Wid;
};
