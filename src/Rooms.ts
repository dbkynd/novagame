export abstract class Room {
  game: Game;
  abstract name: string;
  abstract image: HTMLImageElement;
  doors: Record<Direction, boolean>;

  protected constructor(game: Game, doors: Direction[]) {
    this.game = game;
    this.doors = {
      up: doors.includes('up'),
      down: doors.includes('down'),
      left: doors.includes('left'),
      right: doors.includes('right'),
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Room image
    if (!this.game.hideImages) ctx.drawImage(this.image, 0, 0, this.game.width, this.game.height);

    // Yellow bars to show doorways
    if (this.game.debug) {
      ctx.fillStyle = 'yellow';
      const barLength = 200;
      const barWidth = 10;
      if (this.doors.up)
        ctx.fillRect(this.game.width * 0.5 - barLength * 0.5, this.game.marginY - barWidth * 0.5, barLength, barWidth);
      if (this.doors.down)
        ctx.fillRect(
          this.game.width * 0.5 - barLength * 0.5,
          this.game.height - this.game.marginY - barWidth * 0.5,
          barLength,
          barWidth,
        );
      if (this.doors.left)
        ctx.fillRect(this.game.marginX - barWidth * 0.5, this.game.height * 0.5 - barLength * 0.5, barWidth, barLength);
      if (this.doors.right)
        ctx.fillRect(
          this.game.width - this.game.marginX - barWidth * 0.5,
          this.game.height * 0.5 - barLength * 0.5,
          barWidth,
          barLength,
        );
    }
  }

  hasDoor(direction: Direction): boolean {
    return this.doors[direction];
  }
}

export class BasicRoom extends Room {
  name = 'basic_room';
  image = document.getElementById('room_image') as HTMLImageElement;

  constructor(game: Game, doors: Direction[]) {
    super(game, doors);
  }
}

export class GoalRoom extends Room {
  name = 'goal_room';
  image = new Image();

  constructor(game: Game, doors: Direction[]) {
    super(game, doors);
  }
}

export class BathRoom extends Room {
  name = 'bath_room';
  image = new Image();

  constructor(game: Game, doors: Direction[]) {
    super(game, doors);
  }
}
