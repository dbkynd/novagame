import { computed, createApp } from 'vue';
import Game from './Game';

// Setup game canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = 960;
canvas.height = 720;

// Create the main game instance
const game = new Game(canvas);

// Animation loop
let lastTime = 0;
function animate(timestamp = 0) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  game.render(ctx, deltaTime);
  requestAnimationFrame(animate);
}

// Wait until all assets are downloaded and the DOM is ready before starting the animation loop
window.addEventListener('load', () => {
  // Initialize the game canvas here because I'm guessing with TS the class is hoisted
  // and even things in the constructor are being ran before the DOM is fully loaded??
  game.map.initializeCanvas();
  animate();
});

// Vue Component
createApp({
  setup() {
    function highlightWords(chat: Chat) {
      const directionRegex = /\b(up|down|left|right)\b/i;
      const className = chat.accepted ? 'accepted' : 'duplicate';
      return chat.message.replace(directionRegex, (match) => `<span class="${className}">${match}</span>`);
    }

    function colorUsername(chat: Chat) {
      const name = chat.tags['display-name'] || chat.tags.username;
      const color = chat.tags.color || '#000000';
      return `<span style="color:${color}">${name}</span>`;
    }

    const processedMessages = computed(() => {
      return game.twitch.chats.value.map((chat) => {
        const name = colorUsername(chat);
        const message = highlightWords(chat);
        return `${name}: ${message}`;
      });
    });

    const connectionText = computed(() => {
      return game.twitch.connected.value ? 'Connected' : 'Connecting...';
    });

    return {
      votes: game.votes,
      moves: game.moves,
      wins: game.wins,
      loses: game.loses,
      processedMessages,
      connected: game.twitch.connected,
      connectionText,
    };
  },
}).mount('#app');
