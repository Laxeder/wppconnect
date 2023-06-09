import { Command, Message, PollMessage, PollUpdateMessage } from "rompot";

export class PollCommand extends Command {
  tags: string[] = ["poll"];
  prefix: string = "/";

  public async execute(message: Message): Promise<void> {
    const msg = new PollMessage(message.chat, "Enquete");

    msg.addOption("op1", "poll-id1");
    msg.addOption("op2", "poll-id2");
    msg.addOption("op3", "poll-id3");

    await this.client.send(msg);
  }

  public async response(message: Message): Promise<void> {
    if (message instanceof PollUpdateMessage && message.action == "remove") return;

    await message.chat.send(`Opção ${message.text} (${message.selected}) foi selecionado!`);
  }
}
