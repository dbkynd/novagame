import Game, { RoundState } from './Game';

export default class Player {
  game: Game;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  center: { x: number; y: number };
  width = 100;
  height = 100;
  direction: Direction | null = null;
  speed = 100;
  image = document.getElementById('cat_sprites') as HTMLImageElement;
  spriteWidth = 100;
  spriteHeight = 100;
  frameY = 0;
  maxFrames = 0;
  staggerFrames = 10;
  margin = 0;
  target: { x: number; y: number } | null = null;
  atTarget = false;

  constructor(game: Game) {
    this.game = game;
    this.center = {
      x: this.game.width * 0.5 - this.width * 0.5,
      y: this.game.height * 0.5 - this.height * 0.5,
    };
    this.reset();
  }

  draw(ctx: CanvasRenderingContext2D) {
    let frameX = Math.floor(this.game.frameCount / this.staggerFrames) % this.maxFrames;
    if (this.frameY === 0) frameX = 0;
    if (!this.game.debug) {
      ctx.drawImage(
        this.image,
        frameX * this.spriteWidth + this.margin,
        this.frameY * this.spriteHeight + this.margin,
        this.spriteWidth - this.margin * 2,
        this.spriteHeight - this.margin * 2,
        this.x,
        this.y,
        this.width,
        this.height,
      );
    } else {
      ctx.strokeStyle = 'blue';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  update(deltaTime: number) {
    const movementThreshold = (this.speed * deltaTime) / 1000;

    const target = this.target || this.center;
    const reachedX = Math.abs(this.x - target.x) < movementThreshold;
    const reachedY = Math.abs(this.y - target.y) < movementThreshold;

    if (reachedX && reachedY) {
      this.atTarget = true;
      if (this.game.currentState === RoundState.PlayerMovingToCenter) {
        this.game.transitionToNextState();
        return;
      }
    } else {
      this.atTarget = false;
    }

    switch (this.direction) {
      case 'up':
        this.vx = 0;
        this.vy = -1;
        this.frameY = 0;
        break;
      case 'down':
        this.vx = 0;
        this.vy = 1;
        this.frameY = 0;
        break;
      case 'left':
        this.vx = -1;
        this.vy = 0;
        this.frameY = 0;
        break;
      case 'right':
        this.vx = 1;
        this.vy = 0;
        this.frameY = 0;
        break;
      default:
        this.vx = 0;
        this.vy = 0;
        this.frameY = 0;
    }

    if (
      this.game.currentState === RoundState.PlayerMovingToCenter ||
      this.game.currentState == RoundState.PlayerDoingRoomEntry
    ) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle);
      this.vy = Math.sin(angle);
    }

    this.x += (this.vx * this.speed * deltaTime) / 1000;
    this.y += (this.vy * this.speed * deltaTime) / 1000;

    if (this.hitWall()) this.game.transitionToNextState();
  }

  // Reset player to start position
  reset() {
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height * 0.5 - this.height * 0.5;
    this.frameY = 0;
    this.direction = null;
  }

  hitWall(): boolean {
    return (
      this.x < this.game.marginX ||
      this.x > this.game.width - this.width - this.game.marginX ||
      this.y < this.game.marginY ||
      this.y > this.game.height - this.height - this.game.marginY
    );
  }
}
