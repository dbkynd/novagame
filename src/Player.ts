export default class Player {
  game: Game;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  width = 100;
  height = 100;
  direction: Direction | null = null;
  speed = 100;
  image = document.getElementById('player_image') as HTMLImageElement;

  constructor(game: Game) {
    this.game = game;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height * 0.5 - this.height * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'blue';
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    // ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  update(deltaTime: number) {
    switch (this.direction) {
      case 'up':
        this.vx = 0;
        this.vy = -1;
        break;
      case 'down':
        this.vx = 0;
        this.vy = 1;
        break;
      case 'left':
        this.vx = -1;
        this.vy = 0;
        break;
      case 'right':
        this.vx = 1;
        this.vy = 0;
        break;
      default:
        this.vx = 0;
        this.vy = 0;
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
    return this.x < 0 || this.x > this.game.width - this.width || this.y < 0 || this.y > this.game.height - this.height;
  }
}
