import tmi, { Client } from 'tmi.js';
import { ref } from 'vue';
import type Game from './Game';

export default class Twitch {
  game: Game;
  client: Client;
  chats = ref<Chat[]>([]);
  acceptedVoteUserIds: string[] = [];
  maxChats = 20; // The max number of chats to display on screen
  directionRegex = /\b(up|down|left|right)\b/i;
  connected = ref(false);

  constructor(game: Game) {
    this.game = game;
    this.client = new tmi.Client({
      channels: ['itmejp'],
    });

    this.client.connect().then(() => {});

    this.client.on('connected', () => {
      this.connected.value = true;
    });

    this.client.on('disconnected', () => {
      this.connected.value = false;
    });

    // New chat message
    this.client.on('message', (_channel, tags, message, _self) => {
      const userId = tags['user-id'];
      if (!userId) return;

      // "accepted" is if the chat message is included in the decision-making of this voting round
      let accepted = this.game.doVoting() && !this.acceptedVoteUserIds.includes(userId);

      // Match a direction in the message
      const match = message.match(this.directionRegex);
      if (match) {
        // Only consider the first direction found in the message. i.e. "left right left" will only count once for "left"
        const direction = match[1].toLowerCase() as Direction;
        if (this.game.map.playerRoom?.doors[direction]) {
          this.game.addVote(direction);
          this.acceptedVoteUserIds.push(userId);
        } else {
          accepted = false; // Set accepted to false if there is no door in that direction
        }
      }

      // Add chat for display
      const chat: Chat = { message, tags, accepted };
      this.chats.value.push(chat);
      if (this.chats.value.length > this.maxChats) this.chats.value.shift();
    });
  }

  // Clear chat user ids accepted votes filtering list
  reset() {
    this.acceptedVoteUserIds = [];
  }
}
