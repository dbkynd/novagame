import tmi, { Client } from 'tmi.js';
import { ref } from 'vue';

export default class Twitch {
  game: Game;
  client: Client;
  chats = ref<Chat[]>([]);
  roundEntryUserIds: string[] = [];
  maxChats = 50;
  directionRegex = /\b(up|down|left|right)\b/i;

  constructor(game: Game) {
    this.game = game;
    this.client = new tmi.Client({
      channels: ['dbkynd'],
    });

    this.client.connect();

    this.client.on('message', (channel, tags, message, self) => {
      const id = tags['user-id'];
      if (!id) return;
      const userEntered = this.roundEntryUserIds.includes(id);
      this.roundEntryUserIds.push(id);

      const chat: Chat = {
        tags,
        message,
        accepted: !userEntered,
      };

      this.chats.value.push(chat);
      if (this.chats.value.length > this.maxChats) this.chats.value.shift();

      const match = message.match(this.directionRegex);
      if (match) this.game.addCount(match[1].toLowerCase() as Direction);
    });
  }

  reset() {
    this.roundEntryUserIds = [];
  }
}
