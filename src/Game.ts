import { reactive, ref } from 'vue';
import Twitch from './Twitch';
import Player from './Player';
import Map from './Map';
import GUI from './GUI';

export enum RoundState {
  WaitingForVotes,
  FinalizingVotes,
  PlayerLeavingRoom,
  PlayerDoingRoomEntry,
  PlayerMovingToCenter,
  GameOver,
}

export default class Game {
  debug = true;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  width = 960;
  height = 720;
  twitch: Twitch;
  player: Player;
  map: Map;
  GUI: GUI;

  marginX = 160; // X-axis margin for player collision with game edge
  marginY = 120; // Y-axis margin for player collision with game edge

  wins = ref(0);
  loses = ref(0);
  gameOver = false;
  maxMoves = 10;
  moves = ref(this.maxMoves);
  currentState: RoundState = RoundState.WaitingForVotes;
  roundTimer: number = 0;
  timer = ref(0);
  votingDuration = 10000;
  votingGracePeriod = 2000;
  resetDuration = 5000;

  votes: Record<Direction, number>;
  lastVotedDirection: Direction | null = null;

  fps = 0;
  fpsHistory: number[] = [];
  maxHistory = 10;
  avgFps = 0;
  frameCount = 0;

  audioVolume = 0.4;

  constructor() {
    this.twitch = new Twitch(this);
    this.player = new Player(this);
    this.map = new Map(this);
    this.GUI = new GUI(this);
    this.votes = reactive({ up: 0, down: 0, left: 0, right: 0 });

    this.addListeners();
    this.startRound();
  }

  // Initialize the game canvas
  initializeCanvas() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
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
  render(deltaTime: number) {
    this.frameCount++;

    // Calculate average FPS
    if (deltaTime > 0) {
      this.fps = Math.round(1000 / deltaTime);
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > this.maxHistory) this.fpsHistory.shift();
      const sumFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0);
      this.avgFps = this.fpsHistory.length ? Math.round(sumFps / this.fpsHistory.length) : 0;
    }

    if (this.ctx) this.draw(this.ctx);
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
    this.roundTimer += deltaTime;

    this.map.update(deltaTime);
    this.player.update(deltaTime);
    this.timer.value = 0;

    // Handle round state
    switch (this.currentState) {
      case RoundState.WaitingForVotes: // Collecting votes for player movement from twitch chat
        this.timer.value = Math.floor((this.votingDuration - this.roundTimer + 1000) / 1000);
        if (this.roundTimer >= this.votingDuration) this.transitionToNextState();
        break;
      case RoundState.FinalizingVotes: // Grace period for collecting votes due to chat delay
        if (this.roundTimer >= this.votingGracePeriod) this.transitionToNextState();
        break;
      case RoundState.GameOver: // Wait for a duration before starting the game over
        this.timer.value = Math.floor((this.resetDuration - this.roundTimer + 1000) / 1000);
        if (this.roundTimer >= this.resetDuration) this.transitionToNextState();
        break;
    }
  }

  transitionToNextState() {
    this.roundTimer = 0;

    switch (this.currentState) {
      case RoundState.WaitingForVotes:
        this.currentState = RoundState.FinalizingVotes;
        break;
      case RoundState.FinalizingVotes:
        this.currentState = RoundState.PlayerLeavingRoom;
        this.player.direction = this.chooseDirection();
        break;
      case RoundState.PlayerLeavingRoom:
        this.currentState = RoundState.PlayerDoingRoomEntry;
        this.nextRound();
        break;
      case RoundState.PlayerDoingRoomEntry:
        this.currentState = RoundState.PlayerMovingToCenter;
        break;
      case RoundState.PlayerMovingToCenter:
        this.currentState = RoundState.WaitingForVotes;
        this.startRound();
        break;
      case RoundState.GameOver:
        this.currentState = RoundState.WaitingForVotes;
        this.resetGame();
        this.startRound();
        break;
    }
  }

  // Reset game components in order to start the game anew
  resetGame() {
    this.moves.value = this.maxMoves;
    this.map = new Map(this);
    this.gameOver = false;
  }

  // Start the beginning of each voting round
  startRound() {
    this.twitch.reset();
    this.player.reset();
    this.resetCounts();
  }

  // Advance the game to the next voting round
  nextRound() {
    this.moves.value--;
    if (this.moves.value <= 0) {
      this.loseGame();
      return;
    }

    if (!this.map.playerRoom || !this.player.direction) throw new Error('Missing expected properties');
    this.map.playerRoom.onPlayerExit();
    this.map.playerRoom = this.map.getAdjacentRoom(this.map.playerRoom.x, this.map.playerRoom.y, this.player.direction);
    this.map.playerRoom?.onPlayerEnter();
  }

  // Reset directional count votes to 0
  resetCounts() {
    for (const direction in this.votes) {
      this.votes[direction as Direction] = 0;
    }
  }

  // Use the votes and room state to determine what direction the player will travel this round
  chooseDirection(): Direction {
    // Get the available directions with doors
    const availableDirections = Object.entries(this.map.playerRoom!.doors)
      .filter(([, hasDoor]) => hasDoor)
      .map(([direction]) => direction as Direction);

    // Get votes only for the available directions
    const countsArray = Object.entries(this.votes).filter(([direction]) =>
      availableDirections.includes(direction as Direction),
    ) as [Direction, number][];

    // Determine what the highest vote count was of the available directions
    const maxCount = Math.max(...countsArray.map(([, count]) => count));

    if (maxCount === 0) {
      // If no directions were voted on, choose a random direction from available directions
      return availableDirections[Math.floor(Math.random() * availableDirections.length)];
    } else {
      // Filter directions with the highest votes
      const topDirections = countsArray.filter(([, count]) => count === maxCount).map(([direction]) => direction);

      // If only one direction has the highest vote, choose that
      if (topDirections.length === 1) {
        return topDirections[0];
      } else {
        // If multiple directions have the highest vote, prioritize the last voted one
        if (this.lastVotedDirection && topDirections.includes(this.lastVotedDirection)) {
          return this.lastVotedDirection;
        } else {
          // If the last voted direction is not among the top ones, choose randomly from the top directions
          return topDirections[Math.floor(Math.random() * topDirections.length)];
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
      this.lastVotedDirection = direction;
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
    this.gameOver = true;
    this.currentState = RoundState.GameOver;
  }

  loseGame() {
    this.loses.value++;
    this.gameOver = true;
    this.player.reset();
    this.currentState = RoundState.GameOver;
  }

  allowVoting() {
    return (
      !this.gameOver &&
      (this.currentState === RoundState.WaitingForVotes || this.currentState === RoundState.FinalizingVotes)
    );
  }

  showVotingPanel(show: boolean) {
    const element = document.getElementById('voting-panel');
    if (!element) return;
    element.style.display = show ? 'block' : 'none';
  }
}
