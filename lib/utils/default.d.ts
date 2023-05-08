import winston, { LoggerOptions } from "winston";
import { WPPConnectOption } from "../types/default";
export declare const LOGGER: (options: Partial<LoggerOptions>) => winston.Logger;
export declare const DEFAULT_CLIENT_OPTIONS: WPPConnectOption;
