export default class Player {
  game: Game;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  width = 100;
  height = 100;
  direction: Direction | null = null;
  speed = 200;
  image = document.getElementById('player_image') as HTMLImageElement;
  spriteWidth = 64;
  spriteHeight = 64;
  frameY = 0;
  maxFrames = 6;
  staggerFrames = 10;
  margin = 15;

  constructor(game: Game) {
    this.game = game;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height * 0.5 - this.height * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.game.hideImages) {
      let frameX = Math.floor(this.game.frameCount / this.staggerFrames) % this.maxFrames;
      if (this.frameY === 0) frameX = 0;
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
    }

    if (this.game.debug) {
      ctx.strokeStyle = 'blue';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  update(deltaTime: number) {
    switch (this.direction) {
      case 'up':
        this.vx = 0;
        this.vy = -1;
        this.frameY = 5;
        break;
      case 'down':
        this.vx = 0;
        this.vy = 1;
        this.frameY = 4;
        break;
      case 'left':
        this.vx = -1;
        this.vy = 0;
        this.frameY = 7;
        break;
      case 'right':
        this.vx = 1;
        this.vy = 0;
        this.frameY = 6;
        break;
      default:
        this.vx = 0;
        this.vy = 0;
        this.frameY = 0;
    }

    this.x += (this.vx * this.speed * deltaTime) / 1000;
    this.y += (this.vy * this.speed * deltaTime) / 1000;

    if (this.hitWall()) this.game.startRound();
  }

  reset() {
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height * 0.5 - this.height * 0.5;
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
