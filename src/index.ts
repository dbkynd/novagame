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
  animate();
});

// Vue Component
createApp({
  setup() {
    const highlightWords = (chat: Chat) => {
      const directionRegex = /\b(up|down|left|right)\b/i;
      const className = chat.accepted ? 'accepted' : 'duplicate';
      return chat.message.replace(directionRegex, (match) => `<span class="${className}">${match}</span>`);
    };

    const processedMessages = computed(() => {
      return game.twitch.chats.value.map((chat) => highlightWords(chat));
    });

    const connectionText = computed(() => {
      return game.twitch.connected.value ? 'Connected' : 'Connecting...';
    });

    return {
      votes: game.votes,
      moves: game.moves,
      processedMessages,
      connected: game.twitch.connected,
      connectionText,
    };
  },
}).mount('#app');
