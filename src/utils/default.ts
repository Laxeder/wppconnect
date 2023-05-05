import { CreateOptions } from "@wppconnect-team/wppconnect";

export const DEFAULT_CLIENT_OPTIONS: CreateOptions = {
  session: "session",
  headless: true,
  devtools: false,
  useChrome: true,
  debug: false,
  logQR: true,
  browserWS: "",
  browserArgs: [""],
  puppeteerOptions: {},
  disableWelcome: false,
  updatesLog: true,
  autoClose: 60000,
  tokenStore: "file",
  folderNameToken: "./tokens",
};
