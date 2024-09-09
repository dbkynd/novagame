import Twitch from './Twitch';
import Player from './Player';
import { reactive, ref } from 'vue';
import GUI from './GUI';
import Grid from './Grid';

export default class Game {
  debug = false;
  width: number;
  height: number;
  twitch: Twitch;
  player: Player;
  GUI: GUI;
  grid: Grid;
  gameOver = false;

  counts = reactive({
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  });

  marginX = 160; // X-axis margin for player collision with game edge
  marginY = 120; // Y-axis margin for player collision with game edge

  moves = ref(12);
  roundLength = 10000;
  countdown = this.roundLength;
  doCountdown = true;

  fps = 0;
  fpsHistory: number[] = [];
  maxHistory = 10;
  avgFps = 0;
  frameCount = 0;

  lastUpdatedDirection: Direction | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.twitch = new Twitch(this);
    this.player = new Player(this);
    this.GUI = new GUI(this);
    this.grid = new Grid(this);

    this.addListeners();
    this.startRound();
  }

  addListeners() {
    window.addEventListener('keydown', ({ key }) => {
      // Use the 'd' key to toggle debug mode
      if (key === 'd') this.debug = !this.debug;

      // Use the arrow keys in debug mode to manually add to the direction counters
      if (this.debug) {
        const regex = /^Arrow(Up|Down|Left|Right)$/;
        if (regex.test(key)) {
          const match = key.match(regex);
          if (match) this.addCount(match[1].toLowerCase() as Direction);
        }
      }
    });
  }

  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.frameCount++;

    // Average FPS calculations
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
    this.grid.playerRoom?.draw(ctx);
    this.player.draw(ctx);
    this.GUI.draw(ctx);
    if (this.gameOver) {
      ctx.save();
      ctx.font = '50px Impact';
      ctx.fillStyle = '#ff0000';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width * 0.5, this.height * 0.5);
      ctx.restore();
    }
  }

  update(deltaTime: number) {
    if (this.gameOver) return;

    this.grid.update();
    this.player.update(deltaTime);

    if (this.doCountdown) {
      this.countdown -= deltaTime;
      if (this.countdown <= 0) {
        this.doCountdown = false;
        this.chooseDirection();
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

  chooseDirection() {
    // Get the available directions with doors
    const availableDirections = Object.entries(this.grid.playerRoom!.doors)
      .filter(([_, hasDoor]) => hasDoor)
      .map(([direction]) => direction as Direction);

    // If no doors are available (edge case), do nothing
    if (availableDirections.length === 0) return;

    // Get counts only for the available directions
    const countsArray = Object.entries(this.counts).filter(([direction]) =>
      availableDirections.includes(direction as Direction),
    ) as [Direction, number][];

    const maxCount = Math.max(...countsArray.map(([_, count]) => count));

    if (maxCount === 0) {
      // If no directions were updated, choose a random direction from available directions
      this.player.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
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
    if (this.gameOver || !this.grid.playerRoom) return;
    if (this.grid.playerRoom.doors[direction]) {
      this.counts[direction]++;
      this.lastUpdatedDirection = direction;
    }
  }

  nextRound() {
    if (!this.grid.playerRoom || !this.player.direction) return;
    const nextRoom = this.grid.getAdjacentRoom(this.grid.playerRoom.x, this.grid.playerRoom.y, this.player.direction);
    if (!nextRoom) return;
    this.grid.playerRoom = nextRoom;
    this.grid.playerRoom.onEnter();
    this.moves.value--;
    if (this.moves.value <= 0) this.gameOver = true;
    this.startRound();
  }
}
