import { computed, createApp } from 'vue';
import Game from './Game';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = 960;
canvas.height = 720;

const game = new Game(canvas);

let lastTime = 0;
function animate(timestamp = 0) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  game.render(ctx, deltaTime);
  requestAnimationFrame(animate);
}
animate();

createApp({
  setup() {
    const highlightWords = (message: string) => {
      const directionRegex = /\b(up|down|left|right)\b/i;
      return message.replace(directionRegex, (match) => `<span class="highlight">${match}</span>`);
    };

    const processedMessages = computed(() => {
      return game.twitch.messages.value.map((message) => highlightWords(message));
    });

    return {
      counts: game.counts,
      messages: game.twitch.messages,
      processedMessages,
    };
  },
}).mount('#app');
