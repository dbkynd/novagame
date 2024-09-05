import Twitch from './Twitch';
import Player from './Player';
import { reactive } from 'vue';

export default class Game {
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
  image = document.getElementById('room1_image') as HTMLImageElement;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.twitch = new Twitch(this);
    this.player = new Player(this);
    this.startRound();
  }

  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.draw(ctx);
    this.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    // ctx.drawImage(this.image, 0, 0, this.width, this.height);
    this.player.draw(ctx);
  }

  update(deltaTime: number) {
    this.player.update(deltaTime);

    if (this.doCountdown) {
      this.countdown -= deltaTime;
      if (this.countdown < 0) {
        this.doCountdown = false;
        this.makeDecision();
      }
    }
  }

  startRound() {
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
}
