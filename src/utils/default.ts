import winston, { createLogger, LoggerOptions } from "winston";

import { WPPConnectOption } from "../types/default";

export const LOGGER = (options: Partial<LoggerOptions>) => {
  const logger = createLogger({
    transports: [
      new winston.transports.Console({
        silent: true,
      }),
    ],
    exitOnError: false,
  });

  return logger;
};

export const DEFAULT_CLIENT_OPTIONS: WPPConnectOption = {
  timesForReconnect: 12,
  session: "session",
  devtools: false,
  logger: LOGGER({}),
  useChrome: true,
  debug: false,
  logQR: true,
  disableWelcome: true,
  updatesLog: false,
  autoClose: 300000,
  waitForLogin: false,
  tokenStore: "file",
  folderNameToken: "./tokens",
};
