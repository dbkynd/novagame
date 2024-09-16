import type Game from './Game';
import { RoundState } from './Game';

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
      const states = Object.values(RoundState).filter((x) => typeof x !== 'number');
      const currentState = states[this.game.currentState];

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
        const text = this.game.map.playerRoom.name + ' - ' + currentState;
        ctx.fillText(text, this.game.width - ctx.measureText(text).width - 3, this.game.height - 5);
      }
    }
  }
}
