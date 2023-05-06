import { Command, MediaMessage, Message, StickerMessage, VideoMessage } from "rompot";

export class StickerCommand extends Command {
  tags: string[] = ["sticker"];
  prefix: string = "/";

  public async execute(message: Message): Promise<void> {
    const mediaMessage = message.mention || message;

    if (!(mediaMessage instanceof MediaMessage)) {
      await message.reply("Mencione uma imagem para transforma-la em sticker");
      return;
    }

    const msg = new StickerMessage(message.chat, await mediaMessage.getStream());

    if (mediaMessage instanceof VideoMessage || mediaMessage.isGIF) {
      msg.isGIF = true;
    }

    await this.client.send(msg);
  }
}
