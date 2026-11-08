const TILE_SIZE = 790/15;
const MAP_WIDTH = 15;
const MAP_HEIGHT = 13;

const SPAWN_TILES = [
  { x: 1, y: 1 },                       // top-left
  { x: MAP_WIDTH - 2, y: 1 },          // top-right
  { x: 1, y: MAP_HEIGHT - 2 },         // bottom-left
  { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 } // bottom-right
];

// 0 = floor, 1 = solid wall, 2 = breakable block
const map = Array.from({ length: MAP_HEIGHT }, (_, y) =>
  Array.from({ length: MAP_WIDTH }, (_, x) =>
    x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1
      ? 1
      : 0
  )
);

// palcing unbrakable wals inside the playable area
for (let y = 1; y < MAP_HEIGHT - 1; y++) {
  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    if (x % 2 === 0 && y % 2 === 0) {
      map[y][x] = 1;
    }
  }
}

function drawMap(ctx) {
  map.forEach((row, y) => {
    row.forEach((tile, x) => {
      ctx.fillStyle = tile === 1 ? "#444" : tile === 2 ? "#9b5b2e" : "#75a843";
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "#333";
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
  });

}

function getSpawnPosition(playerIndex = 0) {
  const tile = SPAWN_TILES[playerIndex % SPAWN_TILES.length];

  // Keep the spawn tile clear of walls or blocks.
  map[tile.y][tile.x] = 0;

  return {
    x: tile.x * TILE_SIZE,
    y: tile.y * TILE_SIZE
  };
}

// Keep each spawn tile and its surrounding 3x3 area clear.
const protectedSpawnTiles = new Set();

for (const spawn of SPAWN_TILES) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      protectedSpawnTiles.add(`${spawn.x + dx},${spawn.y + dy}`);
    }
  }
}

// Place destructible walls on some remaining floor tiles.
const DESTRUCTIBLE_WALL_CHANCE = 0.5; // 50% chance per eligible tile

for (let y = 1; y < MAP_HEIGHT - 1; y++) {
  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    const isNearSpawn = protectedSpawnTiles.has(`${x},${y}`);

    if (map[y][x] === 0 && !isNearSpawn &&
        Math.random() < DESTRUCTIBLE_WALL_CHANCE) {
      map[y][x] = 2;
    }
  }
}

function isBlockedAtPixel(x, y) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  return map[tileY]?.[tileX] !== 0; // also blocks outside the map
}