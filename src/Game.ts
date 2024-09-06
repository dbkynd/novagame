import Twitch from './Twitch';
import Player from './Player';
import { reactive } from 'vue';

export default class Game {
  debug = true;
  hideImages = true;
  width: number;
  height: number;
  twitch: Twitch;
  player: Player;
  counts = reactive({
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  });
  roundLength = 5000;
  countdown = this.roundLength;
  doCountdown = true;
  room = document.getElementById('room_image') as HTMLImageElement;
  frameCount = 0;
  marginX = 160;
  marginY = 120;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.twitch = new Twitch(this);
    this.player = new Player(this);

    this.addListeners();
    this.startRound();
  }

  addListeners() {
    window.addEventListener('keydown', ({ key }) => {
      // Use the 'd' key to toggle debug mode
      if (key === 'd') this.debug = !this.debug;

      // Use the arrow keys in debug mode to manually add to the direction counts
      if (this.debug) {
        const regex = /^Arrow(Up|Down|Left|Right)$/;
        if (regex.test(key)) {
          const match = key.match(regex);
          if (match) {
            const direction = match[1].toLowerCase() as Direction;
            this.addCount(direction);
          }
        }
      }
    });
  }

  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.frameCount++;
    this.draw(ctx);
    this.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.hideImages) ctx.drawImage(this.room, 0, 0, this.width, this.height);
    this.player.draw(ctx);

    if (this.debug) {
      ctx.strokeStyle = 'red';
      ctx.strokeRect(this.marginX, this.marginY, this.width - this.marginX * 2, this.height - this.marginY * 2);
    }
  }

  update(deltaTime: number) {
    this.player.update(deltaTime);

    if (this.doCountdown) {
      this.countdown -= deltaTime;
      if (this.countdown <= 0) {
        this.doCountdown = false;
        this.makeDecision();
      }
    }
  }

  startRound() {
    this.twitch.reset();
    this.player.reset();
    this.resetCounts();
    this.countdown = this.roundLength;
    this.doCountdown = true;
  }

  resetCounts() {
    for (const direction in this.counts) {
      this.counts[direction as keyof typeof this.counts] = 0;
    }
  }

  makeDecision() {
    const countsArray = Object.entries(this.counts) as [Direction, number][];
    const maxCount = Math.max(...countsArray.map(([_, count]) => count));
    const topDirections = countsArray.filter(([_, count]) => count === maxCount).map(([direction]) => direction);
    this.player.direction = topDirections[Math.floor(Math.random() * topDirections.length)];
  }

  addCount(direction: Direction) {
    if (direction in this.counts) {
      this.counts[direction]++;
    }
  }
}
