import { Command, Message } from "rompot";

export class ReactCommand extends Command {
  tags: string[] = ["react"];
  prefix: string = "/";

  public async execute(message: Message): Promise<void> {
    await message.addAnimatedReaction(["❤️", "⏳"]);
  }
}
