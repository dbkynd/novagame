import { BasicRoom, GoalRoom, Room } from './Rooms';
import type Game from './Game';

export default class Grid {
  game: Game;
  grid: (Room | null)[][] = [];
  gridSizeX = 5;
  gridSizeY = 4;
  playerRoom: Room | null = null;
  goalRoom: GoalRoom | null = null;

  constructor(game: Game) {
    this.game = game;
    if (this.gridSizeX < 4) throw new Error('The gridSizeX must be more than 4');
    if (this.gridSizeY < 3) throw new Error('The gridSizeY must be more than 3');
    this.initializeGrid();
    this.initializeRooms();
  }

  initializeGrid() {
    // Create an empty grid of null values
    for (let y = 0; y < this.gridSizeY; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridSizeX; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  initializeRooms() {
    // Place player room first, ensuring it has 4 doors
    // Player start position is any random room NOT on the border
    const playerStartX = Math.floor(Math.random() * (this.gridSizeX - 2) + 1);
    const playerStartY = Math.floor(Math.random() * (this.gridSizeY - 2) + 1);
    const playerRoom = new BasicRoom(this.game, playerStartX, playerStartY);
    playerRoom.doors.up = true;
    playerRoom.doors.down = true;
    playerRoom.doors.left = true;
    playerRoom.doors.right = true;
    this.grid[playerStartY][playerStartX] = playerRoom;
    this.playerRoom = this.grid[playerStartY][playerStartX];

    // Place remaining rooms
    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        if (this.grid[y][x]) continue; // Skip any existing rooms
        this.grid[y][x] = new BasicRoom(this.game, x, y);
      }
    }

    // Add doors to each room
    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        this.addDoors(x, y);
      }
    }

    const minDistance = 3;
    const maxDistance = 4;
    const roomsInRange = this.getRoomsWithinRange(this.playerRoom!, minDistance, maxDistance);
    if (!roomsInRange.length) throw new Error('Unable to find a goal room in the given range.');

    // Randomly select one of the rooms in range to be the GoalRoom
    if (roomsInRange.length > 0) {
      const randomRoom = roomsInRange[Math.floor(Math.random() * roomsInRange.length)];
      const goalRoom = new GoalRoom(this.game, randomRoom.x, randomRoom.y);
      goalRoom.doors = randomRoom.doors; // Keep the existing doors
      this.grid[randomRoom.y][randomRoom.x] = goalRoom;
      this.goalRoom = goalRoom;
    }
  }

  addDoors(x: number, y: number) {
    const room = this.grid[y][x];
    if (!room) return;

    // Get possible directions
    const possibleDirections: Direction[] = this.getPossibleDirections(x, y);

    // Assign at least 2 doors
    const doorsToAdd = this.ensureMinimumDoors(room, possibleDirections, 2);

    // Ensure adjacent rooms have corresponding doors
    this.updateAdjacentRooms(x, y, doorsToAdd);
  }

  getPossibleDirections(x: number, y: number): Direction[] {
    const possibleDirections: Direction[] = [];
    if (!this.isOutsideGrid(x, y, 'up')) possibleDirections.push('up');
    if (!this.isOutsideGrid(x, y, 'down')) possibleDirections.push('down');
    if (!this.isOutsideGrid(x, y, 'left')) possibleDirections.push('left');
    if (!this.isOutsideGrid(x, y, 'right')) possibleDirections.push('right');
    return possibleDirections;
  }

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
      if (distance >= minDistance && distance <= maxDistance) {
        roomsInRange.push(room);
      }

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
}
