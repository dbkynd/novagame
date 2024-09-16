import tmi, { Client } from 'tmi.js';
import { ref } from 'vue';
import type Game from './Game';

export default class Twitch {
  game: Game;
  client: Client;
  chats = ref<Chat[]>([]);
  acceptedVoteUserIds: string[] = [];
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

    // New chat message
    this.client.on('message', (channel, tags, message, self) => {
      const userId = tags['user-id'];
      if (!userId) return;

      // "accepted" is if the chat message is included in the decision-making of this game round or not
      let accepted = this.game.doVoting() && !this.acceptedVoteUserIds.includes(userId);

      // Match a direction in the message
      const match = message.match(this.directionRegex);
      if (match) {
        // Only consider the first direction found in the message. i.e. "left right left" will only count once for "left"
        const direction = match[1].toLowerCase() as Direction;
        if (this.game.map.playerRoom?.doors[direction]) {
          this.game.addVote(direction);
        } else {
          accepted = false; // Set accepted to false if there is no door in that direction
        }
      }

      // Set this to no longer accept chats from those that already have a vote accepted this round
      if (accepted) this.acceptedVoteUserIds.push(userId);

      // Add chat for display
      const chat: Chat = { message, accepted };
      this.chats.value.push(chat);
      if (this.chats.value.length > this.maxChats) this.chats.value.shift();
    });
  }

  // Clear chat user ids accepted votes filtering list
  reset() {
    this.acceptedVoteUserIds = [];
  }
}
