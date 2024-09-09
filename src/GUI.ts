import Game from './Game';

export default class GUI {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawMap(ctx);
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

      if (this.game.grid.playerRoom) {
        ctx.fillStyle = 'black';
        ctx.font = '16px Impact';
        ctx.fillText(
          this.game.grid.playerRoom.name,
          this.game.width - ctx.measureText(this.game.grid.playerRoom.name).width - 3,
          this.game.height - 5,
        );
      }
    }
  }

  drawMap(ctx: CanvasRenderingContext2D) {
    const roomSize = 40;
    const spacing = 3;
    const doorSize = roomSize / 4;
    const margin = 0;
    const offsetX = this.game.width - this.game.grid.gridSizeX * roomSize - margin;
    const offsetY = margin;
    const cornerRadius = 8;

    for (let y = 0; y < this.game.grid.gridSizeY; y++) {
      for (let x = 0; x < this.game.grid.gridSizeX; x++) {
        const room = this.game.grid.grid[y][x];
        if (!room) continue;

        const posX = offsetX + x * roomSize;
        const posY = offsetY + y * roomSize;

        // Draw room rectangle
        let color = '#8d8d8d';
        if (room.discovered) color = '#c9c9c9';
        if (room.visited) color = room.color;
        ctx.fillStyle = room === this.game.grid.playerRoom ? '#44eadc' : color;
        ctx.strokeStyle = 'black';
        this.drawRoundedRect(
          ctx,
          posX + spacing,
          posY + spacing,
          roomSize - spacing * 2,
          roomSize - spacing * 2,
          cornerRadius,
        );

        // Highlight goal room
        if (this.game.debug && room === this.game.grid.goalRoom) {
          const treatsIcon = document.getElementById('treats_icon_image') as HTMLImageElement;
          const treatsMargin = 2;
          ctx.drawImage(
            treatsIcon,
            posX + treatsMargin,
            posY + treatsMargin,
            roomSize - treatsMargin * 2,
            roomSize - treatsMargin * 2,
          );
        }

        // Highlight player room
        if (room === this.game.grid.playerRoom) {
          const catIcon = document.getElementById('cat_icon_image') as HTMLImageElement;
          const catMargin = 5;
          ctx.drawImage(
            catIcon,
            posX + catMargin,
            posY + catMargin,
            roomSize - catMargin * 2,
            roomSize - catMargin * 2,
          );
        }

        // Draw doors
        if (this.game.debug || room.visited) {
          ctx.fillStyle = '#ea2424';
          const doorX = posX + roomSize * 0.5 - doorSize * 0.5;
          const doorY = posY + roomSize * 0.5 - doorSize * 0.5;
          if (room.doors.up) ctx.fillRect(doorX, posY, doorSize, spacing);
          if (room.doors.down) ctx.fillRect(doorX, posY + roomSize - spacing, doorSize, spacing);
          if (room.doors.left) ctx.fillRect(posX, doorY, spacing, doorSize);
          if (room.doors.right) ctx.fillRect(posX + roomSize - spacing, doorY, spacing, doorSize);
        }
      }
    }
  }

  drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
