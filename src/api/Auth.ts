import { FileTokenStore, FileTokenStoreOptions, SessionToken, TokenStore } from "@wppconnect-team/wppconnect/dist/token-store";
import { IAuth } from "rompot";

export class WPPFileAuth implements IAuth {
  public store: TokenStore;
  public options: Partial<FileTokenStoreOptions>;

  constructor(options: Partial<FileTokenStoreOptions>) {
    this.options = options;
    this.store = new FileTokenStore(this.options);
  }

  async get(key: string): Promise<any> {
    return await this.store.getToken(key);
  }

  async set(key: string, data: any): Promise<void> {
    await this.store.setToken(key, data);
  }

  async remove(key: string): Promise<void> {
    await this.store.removeToken(key);
  }

  async listAll(key?: string): Promise<string[]> {
    return await this.store.listTokens();
  }
}

export function getTokenStore(auth: IAuth) {
  const tokenStorage: TokenStore = {
    async getToken(sessionName: string) {
      return await auth.get(sessionName);
    },
    async setToken(sessionName: string, tokenData: SessionToken) {
      try {
        await auth.set(sessionName, tokenData);
        return true;
      } catch (err) {
        return false;
      }
    },
    async removeToken(sessionName: string) {
      try {
        await auth.set(sessionName, null);
        return true;
      } catch (err) {
        return false;
      }
    },
    async listTokens() {
      try {
        return await auth.listAll("");
      } catch (err) {
        return [];
      }
    },
  };

  return tokenStorage;
}
