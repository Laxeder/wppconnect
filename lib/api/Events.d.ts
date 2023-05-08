import WPPConnect from "./WPPConnect";
export default class ConfigWPPEvents {
    wpp: WPPConnect;
    timesReconnecting: number;
    constructor(wpp: WPPConnect);
    configure(): void;
    configQREvent(): void;
    configStatusUpdate(): void;
    configOnAnyMessage(): void;
    configPollResponse(): void;
}
