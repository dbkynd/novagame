import tmi, { Client } from 'tmi.js';
import { ref } from 'vue';

export default class Twitch {
  game: Game;
  client: Client;
  chats = ref<Chat[]>([]);
  acceptedEntryUserIds: string[] = [];
  maxChats = 20;
  directionRegex = /\b(up|down|left|right)\b/i;
  connected = ref(false);

  constructor(game: Game) {
    this.game = game;
    this.client = new tmi.Client({
      channels: ['dbkynd'],
    });

    this.client.connect();

    this.client.on('connected', () => {
      this.connected.value = true;
    });

    this.client.on('disconnected', () => {
      this.connected.value = false;
    });

    this.client.on('message', (channel, tags, message, self) => {
      const id = tags['user-id'];
      if (!id) return;

      // "accepted" is if the chat message is included in the decision-making of this game round or not
      let accepted = !this.game.gameOver && this.game.doCountdown && !this.acceptedEntryUserIds.includes(id);

      const match = message.match(this.directionRegex);
      if (match) {
        const direction = match[1].toLowerCase() as Direction;
        if (this.game.grid.playerRoom?.doors[direction]) {
          this.game.addCount(direction);
        } else {
          accepted = false; // Set accepted to false if there is no door in that direction
        }
      }

      // Ignore further chats from those that have an accepted entry
      if (accepted) this.acceptedEntryUserIds.push(id);

      // Add chat
      const chat: Chat = { tags, message, accepted };
      this.chats.value.push(chat);
      if (this.chats.value.length > this.maxChats) this.chats.value.shift();
    });
  }

  reset() {
    this.acceptedEntryUserIds = [];
  }
}
