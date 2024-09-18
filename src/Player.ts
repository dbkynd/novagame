import Game, { RoundState } from './Game';

export default class Player {
  game: Game;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  centerX: number;
  centerY: number;
  width = 100;
  height = 100;
  direction: Direction | null = null;
  speed = 100;
  image = document.getElementById('cat_icon_image') as HTMLImageElement;
  spriteWidth = 112;
  spriteHeight = 112;
  frameY = 0;
  maxFrames = 6;
  staggerFrames = 10;
  margin = 0;
  target: { x: number; y: number } | null = null;

  constructor(game: Game) {
    this.game = game;
    this.centerX = this.game.width * 0.5 - this.width * 0.5;
    this.centerY = this.game.height * 0.5 - this.height * 0.5;
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
      if (this.target) {
        ctx.fillStyle = 'teal';
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  update(deltaTime: number) {
    const movementThreshold = (this.speed * deltaTime) / 1000;

    if (this.game.currentState === RoundState.PlayerMovingToCenter) {
      const reachedCenterX = Math.abs(this.x - this.centerX) < movementThreshold;
      const reachedCenterY = Math.abs(this.y - this.centerY) < movementThreshold;
      if (reachedCenterX && reachedCenterY) {
        this.game.transitionToNextState();
        return;
      }
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
