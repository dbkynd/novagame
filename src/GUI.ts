import type Game from './Game';

export default class GUI {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawDebug(ctx);
  }

  drawDebug(ctx: CanvasRenderingContext2D) {
    if (this.game.debug) {
      ctx.fillStyle = 'red';
      ctx.font = '20px Impact';
      ctx.fillText(this.game.avgFps.toString(), 3, 20);

      ctx.strokeStyle = 'red';
      ctx.strokeRect(
        this.game.marginX,
        this.game.marginY,
        this.game.width - this.game.marginX * 2,
        this.game.height - this.game.marginY * 2,
      );

      if (this.game.map.playerRoom) {
        ctx.fillStyle = 'black';
        ctx.font = '16px Impact';
        ctx.fillText(
          this.game.map.playerRoom.name,
          this.game.width - ctx.measureText(this.game.map.playerRoom.name).width - 3,
          this.game.height - 5,
        );
      }
    }
  }
}
