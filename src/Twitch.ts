import tmi, { Client } from 'tmi.js';
import { ref } from 'vue';

export default class Twitch {
  game: Game;
  client: Client;
  messages = ref<string[]>([]);
  maxMessages = 50;
  directionRegex = /\b(up|down|left|right)\b/i;

  constructor(game: Game) {
    this.game = game;
    this.client = new tmi.Client({
      channels: ['drlupo'],
    });

    this.client.connect();

    this.client.on('message', (channel, tags, message, self) => {
      this.messages.value.push(message);
      if (this.messages.value.length > this.maxMessages) {
        this.messages.value.shift();
      }

      const match = message.match(this.directionRegex);
      if (match) {
        const direction = match[1].toLowerCase() as Direction;
        if (direction in this.game.counts) {
          this.game.counts[direction]++;
        }
      }
    });
  }
}
