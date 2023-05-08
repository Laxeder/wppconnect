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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenStore = exports.WPPFileAuth = void 0;
const token_store_1 = require("@wppconnect-team/wppconnect/dist/token-store");
class WPPFileAuth {
    constructor(options) {
        this.options = options;
        this.store = new token_store_1.FileTokenStore(this.options);
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.store.getToken(key);
        });
    }
    set(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store.setToken(key, data);
        });
    }
    remove(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store.removeToken(key);
        });
    }
    listAll(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.store.listTokens();
        });
    }
}
exports.WPPFileAuth = WPPFileAuth;
function getTokenStore(auth) {
    const tokenStorage = {
        getToken(sessionName) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield auth.get(sessionName);
            });
        },
        setToken(sessionName, tokenData) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield auth.set(sessionName, tokenData);
                    return true;
                }
                catch (err) {
                    return false;
                }
            });
        },
        removeToken(sessionName) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield auth.set(sessionName, null);
                    return true;
                }
                catch (err) {
                    return false;
                }
            });
        },
        listTokens() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield auth.listAll("");
                }
                catch (err) {
                    return [];
                }
            });
        },
    };
    return tokenStorage;
}
exports.getTokenStore = getTokenStore;
//# sourceMappingURL=Auth.js.map