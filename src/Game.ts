import Twitch from './Twitch';
import Player from './Player';
import { reactive } from 'vue';
import { BasicRoom, BathRoom, Room } from './Rooms';
import GUI from './GUI';

export default class Game {
  debug = true;
  hideImages = false;
  width: number;
  height: number;
  twitch: Twitch;
  player: Player;
  GUI: GUI;
  counts = reactive({
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  });
  roundLength = 5000;
  countdown = this.roundLength;
  doCountdown = true;
  frameCount = 0;
  marginX = 160;
  marginY = 120;
  fps = 0;
  fpsHistory: number[] = [];
  maxHistory = 10;
  avgFps = 0;
  lastUpdatedDirection: Direction | null = null;
  room: Room;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.twitch = new Twitch(this);
    this.player = new Player(this);
    this.GUI = new GUI(this);
    this.room = new BathRoom(this, ['right', 'down', 'left', 'up']);

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
    if (deltaTime > 0) {
      this.fps = Math.round(1000 / deltaTime);
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > this.maxHistory) this.fpsHistory.shift();
      const sumFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0);
      this.avgFps = this.fpsHistory.length ? Math.round(sumFps / this.fpsHistory.length) : 0;
    }

    this.draw(ctx);
    this.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.room.draw(ctx);
    this.player.draw(ctx);
    this.GUI.draw(ctx);
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

    if (maxCount === 0) {
      // If no directions were updated, choose a random direction
      this.player.direction = countsArray[Math.floor(Math.random() * countsArray.length)][0];
    } else {
      // Filter directions with the highest count
      const topDirections = countsArray.filter(([_, count]) => count === maxCount).map(([direction]) => direction);

      // If only one direction has the highest count, choose that
      if (topDirections.length === 1) {
        this.player.direction = topDirections[0];
      } else {
        // If multiple directions have the highest count, prioritize the last updated one
        if (this.lastUpdatedDirection && topDirections.includes(this.lastUpdatedDirection)) {
          this.player.direction = this.lastUpdatedDirection;
        } else {
          // If the last updated direction is not among the top ones, choose randomly from the top directions
          this.player.direction = topDirections[Math.floor(Math.random() * topDirections.length)];
        }
      }
    }
  }

  addCount(direction: Direction) {
    if (direction in this.counts) {
      this.counts[direction]++;
      this.lastUpdatedDirection = direction;
    }
  }
}
