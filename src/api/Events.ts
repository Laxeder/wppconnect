import type { PollMessageUpdateType } from "../types/messages";

import { EmptyMessage } from "rompot";

import WPPConnect from "@api/WPPConnect";
import WPPMessage from "@api/WPPMessage";

import { replaceID } from "@utils/generic";

export default class ConfigWPPEvents {
  public wpp: WPPConnect;
  public timesReconnecting: number = 10;

  constructor(wpp: WPPConnect) {
    this.wpp = wpp;
  }

  public configure() {
    this.configStatusUpdate();
    this.configQREvent();
    this.configOnAnyMessage();
    this.configPollResponse();
    // this.configContactsUpdate();
    // this.configChatsUpsert();
    // this.configGroupsUpdate();
    // this.configChatsDelete();
  }

  public configQREvent() {
    this.wpp.client.catchQR = (base64Qrimg, asciiQR) => {
      if (this.wpp.config.logQR) console.log(asciiQR);

      this.wpp.ev.emit("qr", base64Qrimg);
    };
  }

  public configStatusUpdate() {
    this.wpp.client.statusFind = async (status) => {
      if (status == "inChat") {
        this.wpp.status = "online";

        this.wpp.id = replaceID(await this.wpp.client.getWid());

        await this.wpp.readChats();
        await this.wpp.readUsers();
        await this.wpp.readPolls();

        this.wpp.ev.emit("open", { isNewLogin: false });
      }

      if (status == "browserClose" || status == "serverClose" || status == "autocloseCalled") {
        if (this.wpp.status == "online") {
          this.wpp.status = "offline";

          this.wpp.ev.emit("close", {});

          if (this.wpp.config.timesForReconnect > this.timesReconnecting) {
            ++this.timesReconnecting;

            await this.wpp.reconnect();
          }
        }
      }
    };
  }

  public configOnAnyMessage() {
    this.wpp.client.onAnyMessage(async (msg) => {
      try {
        if (!!!msg) return;

        const { message, isValid } = await WPPMessage.Read(this.wpp, msg);

        if (!isValid) return;
        if (!!!message.chat.id) return;
        if (message instanceof EmptyMessage) return;
        if (message.chat.id.includes("status@broadcast")) return;

        if (this.wpp.users[message.user.id]?.name != message.user.name) {
          await this.wpp.addUser(message.user);
        }

        if (this.wpp.chats[message.chat.id]?.name != message.chat.name) {
          await this.wpp.addChat(message.chat);
        }

        this.wpp.ev.emit("message", message);
      } catch (err) {
        this.wpp.ev.emit("error", err);
      }
    });
  }

  public configPollResponse() {
    this.wpp.client.onPollResponse(async (msg: PollMessageUpdateType) => {
      try {
        if (!!!msg) return;

        const pollMessage = await WPPMessage.ReadPollResponse(this.wpp, msg);

        if (!pollMessage) return;

        this.wpp.ev.emit("message", pollMessage);
      } catch (err) {
        this.wpp.ev.emit("error", err);
      }
    });
  }

  // public configContactsUpdate() {
  //   this.wpp.sock.ev.on("contacts.update", async (updates) => {
  //     for (const update of updates) {
  //       try {
  //         update.id = replaceID(update.id);

  //         if (this.wpp.users[update.id]?.name != update.notify || update.verifiedName) {
  //           await this.wpp.readUser(update);
  //         }
  //       } catch (err) {
  //         this.wpp.ev.emit("error", err);
  //       }
  //     }
  //   });
  // }

  // public configChatsUpsert() {
  //   this.wpp.sock.ev.on("chats.upsert", async (updates) => {
  //     for (const update of updates) {
  //       try {
  //         update.id = replaceID(update.id);

  //         if (!this.wpp.chats[update.id]) {
  //           this.wpp.readChat(update);
  //         } else if (!this.wpp.chats[update.id].users[this.wpp.id]) {
  //           this.wpp.chats[update.id].users[this.wpp.id] = new WAUser(this.wpp.id);

  //           await this.wpp.saveChats();
  //         }
  //       } catch (err) {
  //         this.wpp.ev.emit("error", err);
  //       }
  //     }
  //   });
  // }

  // public configGroupsUpdate() {
  //   this.wpp.sock.ev.on("groups.update", async (updates) => {
  //     for (const update of updates) {
  //       try {
  //         update.id = replaceID(update.id);

  //         if (this.wpp.chats[update.id]?.name != update.subject) {
  //           await this.wpp.readChat(update);
  //         }
  //       } catch (err) {
  //         this.wpp.ev.emit("error", err);
  //       }
  //     }
  //   });
  // }

  // public configChatsDelete() {
  //   this.wpp.sock.ev.on("chats.delete", async (deletions) => {
  //     for (const id of deletions) {
  //       try {
  //         await this.wpp.removeChat(new Chat(id));
  //       } catch (err) {
  //         this.wpp.ev.emit("error", err);
  //       }
  //     }
  //   });
  // }
}
