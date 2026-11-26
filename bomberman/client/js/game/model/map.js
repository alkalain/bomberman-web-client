const TILE_SIZE = 790 / 15;
const MAP_WIDTH = 15;
const MAP_HEIGHT = 13;

const SPAWN_TILES = [
  { x: 1, y: 1 }, // top-left
  { x: MAP_WIDTH - 2, y: 1 }, // top-right
  { x: 1, y: MAP_HEIGHT - 2 }, // bottom-left
  { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }, // bottom-right
];

export const SPAWN_COULEUR = {
  bleu: 0,
  rose: 1,
  rouge: 2,
  jaune: 3,
};

// ajout d'une image pour les blocs d'eau
// poids : plus il est grand, plus le sol est fréquent
export const SOLS = [
  { src: "img/map/sol1.png", poids: 95 }, // commun, 60%
  { src: "img/map/sol2.png", poids: 2 }, // peu rare, 25 %
  { src: "img/map/sol3.png", poids: 1 }, // rare, 10%
  { src: "img/map/sol4.png", poids: 1 }, // très rare, 10%
];

// Place destructible walls on some remaining floor tiles.
export const DESTRUCTIBLE_WALL_CHANCE = 0.5; // 50% chance per eligible tile

export class GameMap {
  constructor({ debrisVariantCount = 5 } = {}) {
    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;
    this.tileSize = TILE_SIZE;
    this.debrisVariantCount = debrisVariantCount;

    this.grid = Array.from({ length: this.height }, (_, row) =>
      Array.from({ length: this.width }, (_, col) =>
        col === 0 || row === 0 || col === this.width - 1 || row === this.height - 1
          ? 1
          : 0,
      ),
    );

    this.floorVariants = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => this.tirerSol()),
    );

    this.destroyedBlocks = new Map();

    this.spawnByTile = new Map(
      SPAWN_TILES.map((tile, index) => [
        `${tile.x},${tile.y}`,
        Object.keys(SPAWN_COULEUR)[index],
      ]),
    );

    this.protectSpawnAreas();
    this.placeInnerWalls();
    this.placeDestructibleWalls();
  }
  
  getTileAt(col, row) {
    return this.grid[row]?.[col];
  }

  isBlockedAtPixel(x, y) {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    return this.getTileAt(col, row) !== 0;
  }

  getSpawnPosition(index = 0) {
    const tile = SPAWN_TILES[index % SPAWN_TILES.length];
    return { x: tile.x * this.tileSize, y: tile.y * this.tileSize };
  }

  destroyBlockAt(col, row) {
    if (this.getTileAt(col, row) !== 2) return false;

    this.grid[row][col] = 0;
    const variant = Math.floor(Math.random() * this.debrisVariantCount);
    this.destroyedBlocks.set(`${col},${row}`, variant);
    return true;
  }

  tirerSol() {
    const total = SOLS.reduce((somme, s) => somme + s.poids, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SOLS.length; i++) {
      r -= SOLS[i].poids;
      if (r < 0) return i;
    }
    return 0;
  }

  protectSpawnAreas() {
    this.protectedSpawnTiles = new Set();

    for (const spawn of SPAWN_TILES) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          this.protectedSpawnTiles.add(`${spawn.x + dx},${spawn.y + dy}`);
        }
      }
    }
  }

  placeInnerWalls() {
    for (let row = 1; row < this.height - 1; row++) {
      for (let col = 1; col < this.width - 1; col++) {
        if (col % 2 === 0 && row % 2 === 0) {
          this.grid[row][col] = 1;
        }
      }
    }
  }

  placeDestructibleWalls() {
    for (let row = 1; row < this.height - 1; row++) {
      for (let col = 1; col < this.width - 1; col++) {
        const nearSpawn = this.protectedSpawnTiles.has(`${col},${row}`);

        if (
          this.grid[row][col] === 0 &&
          !nearSpawn &&
          Math.random() < DESTRUCTIBLE_WALL_CHANCE
        ) {
          this.grid[row][col] = 2;
        }
      }
    }
  }
}
