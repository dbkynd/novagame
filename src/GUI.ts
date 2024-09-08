import Game from './Game';

export default class GUI {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawFPS(ctx);
    this.drawMap(ctx);
    this.drawDebug(ctx);
  }

  drawFPS(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'red';
    ctx.font = '20px Impact';
    ctx.fillText(this.game.avgFps.toString(), 3, 20);
  }

  drawDebug(ctx: CanvasRenderingContext2D) {
    if (this.game.debug) {
      ctx.strokeStyle = 'red';
      ctx.strokeRect(
        this.game.marginX,
        this.game.marginY,
        this.game.width - this.game.marginX * 2,
        this.game.height - this.game.marginY * 2,
      );

      ctx.fillStyle = 'black';
      ctx.font = '20px Impact';
      ctx.fillText(this.game.room.name, this.game.width - ctx.measureText(this.game.room.name).width - 3, 20);
    }
  }

  drawMap(ctx: CanvasRenderingContext2D) {}
}
