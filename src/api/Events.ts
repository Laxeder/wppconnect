import { StatusFind } from "@wppconnect-team/wppconnect";
import { Message } from "rompot";

import WPPConnect from "@api/WPPConnect";

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

  public configOnAnyMessage() {
    this.wpp.client.onAnyMessage(async (message) => {
      try {
        console.log(message)
        
        const chatId = replaceID(message.chatId);

        const msg = new Message(chatId, "");

        this.wpp.ev.emit("message", msg);
      } catch (err) {
        this.wpp.ev.emit("error", err);
      }
    });
  }

  public configStatusUpdate(configure: boolean = false) {
    this.wpp.client.statusFind = async (status: StatusFind, session: string) => {
      console.log("Status Session: ", status);

      if (status == "notLogged") {
        this.wpp.ev.emit("connecting", {});
      }

      if (status == "inChat") {
        this.wpp.status = "online";

        this.wpp.id = replaceID(await this.wpp.client.getWid());

        await this.wpp.readChats();
        await this.wpp.readUsers();
        await this.wpp.readPolls();
        await this.wpp.readSendedMessages();

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
