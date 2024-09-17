import type Game from './Game';
import { BasicRoom, GoalRoom, Room } from './Rooms';

export default class Map {
  game: Game;
  grid: (Room | null)[][] = [];
  gridSizeX = 4;
  gridSizeY = 4;
  playerRoom: Room | null = null;
  playerRoomColor = '#44eadc'; // Minimap background color
  goalRoom: GoalRoom | null = null;
  minGoalDistance = 3;
  maxGoalDistance = 4;
  mapCanvas: HTMLCanvasElement | null = null;
  mapCtx: CanvasRenderingContext2D | null = null;

  constructor(game: Game) {
    this.game = game;
    if (this.gridSizeX < 4) throw new Error('The gridSizeX must be 4 or more');
    if (this.gridSizeY < 3) throw new Error('The gridSizeY must be 3 or more');

    this.initializeRooms();
  }

  // Initialize the minimap canvas
  initializeCanvas() {
    this.mapCanvas = document.getElementById('map-canvas') as HTMLCanvasElement;
    this.mapCtx = this.mapCanvas.getContext('2d') as CanvasRenderingContext2D;
    this.mapCanvas.width = 320;
    this.mapCanvas.height = (this.gridSizeY / this.gridSizeX) * this.mapCanvas.width;
  }

  initializeRooms() {
    this.initializeGrid();
    this.setPlayerRoom();
    this.setRemainingRooms();
    this.addDoors();
    this.setGoalRoom();
  }

  // Create an empty grid of null values
  initializeGrid() {
    for (let y = 0; y < this.gridSizeY; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridSizeX; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  // Create a basic room for the player to start in and add it to the grid
  setPlayerRoom() {
    // Player start position is any random room NOT along the border
    const playerStartX = Math.floor(Math.random() * (this.gridSizeX - 2) + 1);
    const playerStartY = Math.floor(Math.random() * (this.gridSizeY - 2) + 1);
    const playerRoom = new BasicRoom(this.game, playerStartX, playerStartY);
    // The player room starts with all 4 doors
    playerRoom.doors.up = true;
    playerRoom.doors.down = true;
    playerRoom.doors.left = true;
    playerRoom.doors.right = true;
    this.grid[playerStartY][playerStartX] = playerRoom;
    this.playerRoom = this.grid[playerStartY][playerStartX];
  }

  // Fill the rest of the grid with rooms
  setRemainingRooms() {
    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        if (this.grid[y][x]) continue; // Skip any existing rooms
        this.grid[y][x] = new BasicRoom(this.game, x, y);
      }
    }
  }

  // Add at least 2 doors to every room and connect adjacent rooms
  addDoors() {
    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        const room = this.grid[y][x];
        if (!room) return;

        const possibleDirections: Direction[] = this.getPossibleDirections(x, y);
        const doorsToAdd = this.ensureMinimumDoors(room, possibleDirections, 2);
        this.updateAdjacentRooms(x, y, doorsToAdd);
      }
    }
  }

  // Select a valid room to be the goal room
  setGoalRoom() {
    // Get eligible rooms within a range of moves to set as the goal room
    const roomsInRange = this.getRoomsWithinRange(this.playerRoom!, this.minGoalDistance, this.maxGoalDistance);
    if (!roomsInRange.length) throw new Error('Unable to find a goal room in the given range.');

    // Randomly select one of the rooms in range to be the goal room
    const randomRoom = roomsInRange[Math.floor(Math.random() * roomsInRange.length)];
    const goalRoom = new GoalRoom(this.game, randomRoom.x, randomRoom.y);
    goalRoom.doors = randomRoom.doors; // Copy the existing doors
    this.grid[randomRoom.y][randomRoom.x] = goalRoom;
    this.goalRoom = this.grid[randomRoom.y][randomRoom.x];
  }

  // Get directions not outside the grid boundary
  getPossibleDirections(x: number, y: number): Direction[] {
    const possibleDirections: Direction[] = [];
    if (!this.isOutsideGrid(x, y, 'up')) possibleDirections.push('up');
    if (!this.isOutsideGrid(x, y, 'down')) possibleDirections.push('down');
    if (!this.isOutsideGrid(x, y, 'left')) possibleDirections.push('left');
    if (!this.isOutsideGrid(x, y, 'right')) possibleDirections.push('right');
    return possibleDirections;
  }

  // Make sure at least 2 doors are added to each room accounting for doors already added from adjacent rooms
  ensureMinimumDoors(room: Room, possibleDirections: Direction[], minDoors: number): Direction[] {
    const currentDoors = Object.entries(room.doors)
      .filter(([_, hasDoor]) => hasDoor)
      .map(([direction]) => direction as Direction);

    const remainingDirections = possibleDirections.filter((dir) => !currentDoors.includes(dir));

    // Add doors until the minimum number is reached
    while (currentDoors.length < minDoors && remainingDirections.length > 0) {
      const randomDir = remainingDirections[Math.floor(Math.random() * remainingDirections.length)];
      currentDoors.push(randomDir);
      room.doors[randomDir] = true;
      remainingDirections.splice(remainingDirections.indexOf(randomDir), 1);
    }

    return currentDoors;
  }

  // Add doors to an adjacent room
  updateAdjacentRooms(x: number, y: number, doors: Direction[]) {
    doors.forEach((dir) => {
      const adjacentRoom = this.getAdjacentRoom(x, y, dir);
      if (adjacentRoom) {
        switch (dir) {
          case 'up':
            adjacentRoom.doors.down = true;
            break;
          case 'down':
            adjacentRoom.doors.up = true;
            break;
          case 'left':
            adjacentRoom.doors.right = true;
            break;
          case 'right':
            adjacentRoom.doors.left = true;
            break;
        }
      }
    });
  }

  // Returns true if the room in the given direction from the room at x,y is outside the map grid
  isOutsideGrid(x: number, y: number, direction: Direction) {
    return (
      (direction === 'up' && y === 0) ||
      (direction === 'down' && y === this.gridSizeY - 1) ||
      (direction === 'left' && x === 0) ||
      (direction === 'right' && x === this.gridSizeX - 1)
    );
  }

  // breadth-first search (BFS) algorithm
  getRoomsWithinRange(startRoom: Room, minDistance: number, maxDistance: number): Room[] {
    const queue: { room: Room; distance: number }[] = [{ room: startRoom, distance: 0 }];
    const visited = new Set<Room>();
    const roomsInRange: Room[] = [];

    while (queue.length > 0) {
      const { room, distance } = queue.shift()!;

      // Skip if already visited
      if (visited.has(room)) continue;
      visited.add(room);

      // Check if the room is within the desired range
      if (distance >= minDistance && distance <= maxDistance) roomsInRange.push(room);

      // Stop if we exceed the maximum distance
      if (distance >= maxDistance) continue;

      // Explore connected rooms via doors
      for (const direction of ['up', 'down', 'left', 'right'] as Direction[]) {
        if (room.doors[direction]) {
          const adjacentRoom = this.getAdjacentRoom(room.x, room.y, direction);
          if (adjacentRoom && !visited.has(adjacentRoom)) {
            queue.push({ room: adjacentRoom, distance: distance + 1 });
          }
        }
      }
    }

    return roomsInRange;
  }

  // Returns a Room in a given direction from the room at x,y if it exists
  getAdjacentRoom(x: number, y: number, direction: Direction): Room | null {
    switch (direction) {
      case 'up':
        return this.grid[y - 1]?.[x] || null;
      case 'down':
        return this.grid[y + 1]?.[x] || null;
      case 'left':
        return this.grid[y]?.[x - 1] || null;
      case 'right':
        return this.grid[y]?.[x + 1] || null;
      default:
        return null;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.playerRoom?.draw(ctx); // Draw whatever room the player is in
    if (this.mapCtx) this.drawMiniMap(this.mapCtx); // Draw the minimap
  }

  update() {
    // Map visibility
    if (this.playerRoom) {
      this.playerRoom.visited = true;
      // "discover" adjacent rooms that have doors
      const up = this.getAdjacentRoom(this.playerRoom.x, this.playerRoom.y, 'up');
      const down = this.getAdjacentRoom(this.playerRoom.x, this.playerRoom.y, 'down');
      const left = this.getAdjacentRoom(this.playerRoom.x, this.playerRoom.y, 'left');
      const right = this.getAdjacentRoom(this.playerRoom.x, this.playerRoom.y, 'right');
      if (this.playerRoom.doors.up && up) up.discovered = true;
      if (this.playerRoom.doors.down && down) down.discovered = true;
      if (this.playerRoom.doors.left && left) left.discovered = true;
      if (this.playerRoom.doors.right && right) right.discovered = true;
    }

    // Game over if player reached goal room
    if (this.playerRoom === this.goalRoom) {
      this.game.player.reset();
      this.game.gameOver = true;
    }
  }

  drawMiniMap(ctx: CanvasRenderingContext2D) {
    const spacing = 3;
    const roomSize = (ctx.canvas.width - spacing * (this.gridSizeX + 1)) / this.gridSizeX;
    const doorSize = roomSize / 4;
    const offsetX = spacing * 3;
    const offsetY = spacing * 3;
    const cornerRadius = 8;

    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        const room = this.grid[y][x];
        if (!room) continue;

        const posX = offsetX + x * roomSize;
        const posY = offsetY + y * roomSize;

        // Draw room rectangle
        ctx.fillStyle = room === this.playerRoom ? this.playerRoomColor : room.color;
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
        if (this.game.debug && room === this.goalRoom) {
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
        if (room === this.playerRoom) {
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
