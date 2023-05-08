import { FileTokenStoreOptions, SessionToken, TokenStore } from "@wppconnect-team/wppconnect/dist/token-store";
import { IAuth } from "rompot";
export declare class WPPFileAuth implements IAuth {
    store: TokenStore;
    options: Partial<FileTokenStoreOptions>;
    constructor(options: Partial<FileTokenStoreOptions>);
    get(key: string): Promise<any>;
    set(key: string, data: any): Promise<void>;
    remove(key: string): Promise<void>;
    listAll(key?: string): Promise<string[]>;
}
export declare function getTokenStore(auth: IAuth): TokenStore<SessionToken>;
