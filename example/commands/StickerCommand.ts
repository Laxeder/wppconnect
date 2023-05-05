import { Command, MediaMessage, Message, StickerMessage } from "rompot";

export class StickerCommand extends Command {
  tags: string[] = ["s", "t", "i", "c", "k", "e", "r"];
  reqTags: number = 1;
  prefix: string = "/";

  public async execute(message: Message): Promise<void> {
    const mediaMessage = message.mention || message;

    if (!(mediaMessage instanceof MediaMessage)) {
      await message.reply("Mencione uma imagem para transforma-la em sticker");
      return;
    }

    const msg = new StickerMessage(message.chat, await mediaMessage.getStream());

    await this.client.send(msg);
  }
}