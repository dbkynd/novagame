import { computed, createApp } from 'vue';
import Game from './Game';

// Create the main game instance
const game = new Game();

// Animation loop
let lastTime = 0;
function animate(timestamp = 0) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  game.render(deltaTime);
  requestAnimationFrame(animate);
}

// Wait until all assets are downloaded and the DOM is ready before starting the animation loop
window.addEventListener('load', () => {
  // Initialize the canvases here because something happens when a canvas element is a child element
  // of the element that is mounted with Vue (#app) and it loses its reference. When making things reactive??
  game.initializeCanvas();
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
      timer: game.timer,
      votingDialog: true,
    };
  },
}).mount('#app');
