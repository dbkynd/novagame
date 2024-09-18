import type Game from './Game';

export abstract class Room {
  game: Game;
  abstract name: string;
  abstract image: HTMLImageElement;
  x: number; // Map grid X position
  y: number; // Map grid Y position
  doors: Record<Direction, boolean>;
  discovered = false; // Player has seen this room's door
  visited = false; // Player has visited this room
  undiscoveredColor = '#8d8d8d'; // Map background colors
  discoveredColor = '#c9c9c9';
  visitedColor = '#f8f8f8';

  protected constructor(game: Game, x: number, y: number) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.doors = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
  }

  get color(): string {
    let color = this.undiscoveredColor;
    if (this.discovered) color = this.discoveredColor;
    if (this.visited) color = this.visitedColor;
    return color;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.game.debug) {
      // Room image
      ctx.drawImage(this.image, 0, 0, this.game.width, this.game.height);
    } else {
      // Yellow bars to show doorways
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

  onPlayerEnter() {
    // Position the player on the opposite side of where they exited the last room
    switch (this.game.player.direction) {
      case 'up':
        this.game.player.x = this.game.width * 0.5 - this.game.player.width * 0.5;
        this.game.player.y = this.game.height - this.game.player.height - this.game.marginY;
        break;
      case 'down':
        this.game.player.x = this.game.width * 0.5 - this.game.player.width * 0.5;
        this.game.player.y = this.game.marginY;
        break;
      case 'left':
        this.game.player.x = this.game.width - this.game.player.width - this.game.marginX;
        this.game.player.y = this.game.height * 0.5 - this.game.player.height * 0.5;
        break;
      case 'right':
        this.game.player.x = this.game.marginX;
        this.game.player.y = this.game.height * 0.5 - this.game.player.height * 0.5;
        break;
    }
  }
}

export class BasicRoom extends Room {
  name = 'basic_room';
  image = document.getElementById('room_image') as HTMLImageElement;

  constructor(game: Game, x: number, y: number) {
    super(game, x, y);
  }

  override onPlayerEnter() {
    super.onPlayerEnter();
    this.game.transitionToNextState();
  }
}

export class GoalRoom extends Room {
  name = 'goal_room';
  image = document.getElementById('room_image') as HTMLImageElement;

  constructor(game: Game, x: number, y: number) {
    super(game, x, y);
  }

  override onPlayerEnter() {
    super.onPlayerEnter();
    this.game.winGame();
  }
}

export class LitterRoom extends Room {
  name = 'litter_room';
  image = document.getElementById('room_image') as HTMLImageElement;
  override visitedColor = 'yellow';

  constructor(game: Game, x: number, y: number) {
    super(game, x, y);
  }

  override onPlayerEnter() {
    super.onPlayerEnter();
    this.game.transitionToNextState();
  }
}
