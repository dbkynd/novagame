import { reactive, ref } from 'vue';
import Twitch from './Twitch';
import Player from './Player';
import Map from './Map';
import GUI from './GUI';

export default class Game {
  debug = false;
  width: number;
  height: number;
  twitch: Twitch;
  player: Player;
  map: Map;
  GUI: GUI;
  wins = ref(0);
  loses = ref(0);
  gameOver = false;
  votes: Record<Direction, number>;
  lastUpdatedVote: Direction | null = null;

  marginX = 160; // X-axis margin for player collision with game edge
  marginY = 120; // Y-axis margin for player collision with game edge

  maxMoves = 10;
  moves = ref(this.maxMoves);
  roundDuration = 1000; // Duration of voting round
  countdown = this.roundDuration;
  doCountdown = false;
  resetTimer = 0;
  resetDuration = 3000; // How long after game over does the game restart

  fps = 0;
  fpsHistory: number[] = [];
  maxHistory = 10;
  avgFps = 0;
  frameCount = 0;

  audioVolume = 0.4;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.twitch = new Twitch(this);
    this.player = new Player(this);
    this.map = new Map(this);
    this.GUI = new GUI(this);
    this.votes = reactive({ up: 0, down: 0, left: 0, right: 0 });

    this.addListeners();
    this.startRound();
  }

  // Keyboard listeners
  addListeners() {
    window.addEventListener('keydown', ({ key }) => {
      // Use the 'd' key to toggle debug mode
      if (key === 'd') this.debug = !this.debug;

      // Use the arrow keys in debug mode to manually add to the direction counters
      if (this.debug) {
        const regex = /^Arrow(Up|Down|Left|Right)$/;
        if (regex.test(key)) {
          const match = key.match(regex);
          if (match) this.addVote(match[1].toLowerCase() as Direction);
        }
      }
    });
  }

  // Main game loop
  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.frameCount++;

    // Calculate average FPS
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

  // Draw a frame of the game - The order is important here for layering
  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.map.draw(ctx);
    this.player.draw(ctx);
    this.GUI.draw(ctx);
    if (this.gameOver) this.drawGameOver(ctx);
  }

  // Update all components for the next frame
  update(deltaTime: number) {
    if (!this.gameOver) {
      this.map.update();
      this.player.update(deltaTime);

      if (this.doCountdown) {
        this.countdown -= deltaTime;
        if (this.countdown <= 0) {
          this.doCountdown = false;
          this.chooseDirection();
        }
      }
    } else {
      this.resetTimer += deltaTime;
      if (this.resetTimer >= this.resetDuration) {
        this.resetTimer = 0;
        this.resetGame();
      }
    }
  }

  // Start the beginning of each voting round
  startRound() {
    this.twitch.reset();
    this.player.reset();
    this.resetCounts();
    this.countdown = this.roundDuration;
    this.doCountdown = true;
  }

  // Advance the game to the next voting round
  nextRound() {
    if (!this.map.playerRoom || !this.player.direction) return;
    const nextRoom = this.map.getAdjacentRoom(this.map.playerRoom.x, this.map.playerRoom.y, this.player.direction);
    if (!nextRoom) return; // Edge case - We should only be getting directions to a valid room we can move to
    this.moves.value--;
    if (this.moves.value <= 0) this.loseGame();
    this.map.playerRoom = nextRoom;
    this.map.playerRoom.onPlayerEnter();
    this.startRound();
  }

  // Reset directional count votes to 0
  resetCounts() {
    for (const direction in this.votes) {
      this.votes[direction as Direction] = 0;
    }
  }

  // Use the votes and room state to determine what direction the player will travel this round
  chooseDirection() {
    // Get the available directions with doors
    const availableDirections = Object.entries(this.map.playerRoom!.doors)
      .filter(([, hasDoor]) => hasDoor)
      .map(([direction]) => direction as Direction);

    // If no doors are available (edge case), do nothing
    if (availableDirections.length === 0) return;

    // Get votes only for the available directions
    const countsArray = Object.entries(this.votes).filter(([direction]) =>
      availableDirections.includes(direction as Direction),
    ) as [Direction, number][];

    // Determine what the highest vote count was of the available directions
    const maxCount = Math.max(...countsArray.map(([, count]) => count));

    if (maxCount === 0) {
      // If no directions were voted on, choose a random direction from available directions
      this.player.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
    } else {
      // Filter directions with the highest votes
      const topDirections = countsArray.filter(([, count]) => count === maxCount).map(([direction]) => direction);

      // If only one direction has the highest vote, choose that
      if (topDirections.length === 1) {
        this.player.direction = topDirections[0];
      } else {
        // If multiple directions have the highest vote, prioritize the last voted one
        if (this.lastUpdatedVote && topDirections.includes(this.lastUpdatedVote)) {
          this.player.direction = this.lastUpdatedVote;
        } else {
          // If the last voted direction is not among the top ones, choose randomly from the top directions
          this.player.direction = topDirections[Math.floor(Math.random() * topDirections.length)];
        }
      }
    }
  }

  // Add a directional vote to this game round
  addVote(direction: Direction) {
    if (this.gameOver || !this.map.playerRoom) return;
    // Only add the vote if there is a door in that direction
    if (this.map.playerRoom.doors[direction]) {
      this.votes[direction]++;
      this.lastUpdatedVote = direction;
    }
  }

  drawGameOver(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = '50px Impact';
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.width * 0.5, this.height * 0.5);
    ctx.restore();
  }

  // Reset game components in order to start the game anew
  resetGame() {
    this.moves.value = this.maxMoves;
    this.map = new Map(this);
    this.gameOver = false;
    this.startRound();
  }

  // Clone and play a sound at a reduced volume
  playSound(sound: HTMLAudioElement) {
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = this.audioVolume;
    clone.play().catch(() => {
      // Do nothing
    });
  }

  winGame() {
    this.wins.value++;
    const sound = document.getElementById('cheer_sound') as HTMLAudioElement;
    this.playSound(sound);
  }

  loseGame() {
    this.loses.value++;
    this.gameOver = true;
  }
}
