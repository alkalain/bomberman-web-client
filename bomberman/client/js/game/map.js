const TILE_SIZE = 790 / 15;
const MAP_WIDTH = 15;
const MAP_HEIGHT = 13;

const SPAWN_TILES = [
  { x: 1, y: 1 }, // top-left
  { x: MAP_WIDTH - 2, y: 1 }, // top-right
  { x: 1, y: MAP_HEIGHT - 2 }, // bottom-left
  { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }, // bottom-right
];

// Couleur attribuée à chaque coin (même ordre que SPAWN_TILES)
const COULEUR_DU_SPAWN = ["bleu", "rose", "rouge", "jaune"];

// Inverse : couleur -> index du coin
const SPAWN_COULEUR = {};
COULEUR_DU_SPAWN.forEach((c, i) => (SPAWN_COULEUR[c] = i));

// Images des coins
const imgsSpawn = {};
for (const c of COULEUR_DU_SPAWN) {
  imgsSpawn[c] = new Image();
  imgsSpawn[c].src = `img/map/spawn_${c}.png`;
  imgsSpawn[c].onerror = () =>
    console.error("Image introuvable : " + imgsSpawn[c].src);
}

// "x,y" -> couleur, pour retrouver vite si une case est un coin de spawn
const spawnParCase = new Map();
SPAWN_TILES.forEach((s, i) =>
  spawnParCase.set(`${s.x},${s.y}`, COULEUR_DU_SPAWN[i]),
);

// ajout d'une image pour les blocs cassables
const imgBloc = new Image();
imgBloc.src = "img/map/bloc.png";
imgBloc.onerror = () => console.error("Image introuvable : " + imgBloc.src);

// ajout d'une image pour les blocs détruits
const NB_DECOMBRES = 5; // nombre d'images de décombres

const imgsDecombres = Array.from({ length: NB_DECOMBRES }, (_, i) => {
  const img = new Image();
  img.src = `img/map/decombres${i + 1}.png`;
  img.onerror = () => console.error("Image introuvable : " + img.src);
  return img;
});

// "x,y" -> numéro de l'image choisie pour cette case
const blocsDetruits = new Map();

// ajout d'une image pour les blocs d'eau
// poids : plus il est grand, plus le sol est fréquent
const SOLS = [
  { src: "img/map/sol1.png", poids: 95 }, // commun, 60%
  { src: "img/map/sol2.png", poids: 2 }, // peu rare, 25 %
  { src: "img/map/sol3.png", poids: 1 }, // rare, 10%
  { src: "img/map/sol4.png", poids: 1 }, // très rare, 5%
];

const imgsSol = SOLS.map((s) => {
  const img = new Image();
  img.src = s.src;
  img.onerror = () => console.error("Image introuvable : " + img.src);
  return img;
});

// Tirage pondéré : renvoie l'index d'un sol
function tirerSol() {
  const total = SOLS.reduce((somme, s) => somme + s.poids, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SOLS.length; i++) {
    r -= SOLS[i].poids;
    if (r < 0) return i;
  }
  return 0;
}

// ajout d'une image pour les murs
const imgMur = new Image();
imgMur.src = "img/map/mur.png";
imgMur.onerror = () => console.error("Image introuvable : " + imgMur.src);

const imgBordure = new Image();
imgBordure.src = "img/map/bordure.png";
imgBordure.onerror = () =>
  console.error("Image introuvable : " + imgBordure.src);

// 0 = floor, 1 = solid wall, 2 = breakable block
const map = Array.from({ length: MAP_HEIGHT }, (_, y) =>
  Array.from({ length: MAP_WIDTH }, (_, x) =>
    x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1 ? 1 : 0,
  ),
);

// palcing unbrakable wals inside the playable area
for (let y = 1; y < MAP_HEIGHT - 1; y++) {
  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    if (x % 2 === 0 && y % 2 === 0) {
      map[y][x] = 1;
    }
  }
}

// variantesSol[y][x] = index du sol de cette case
const variantesSol = Array.from({ length: MAP_HEIGHT }, () =>
  Array.from({ length: MAP_WIDTH }, () => tirerSol()),
);

function drawMap(ctx) {
  map.forEach((row, y) => {
    row.forEach((tile, x) => {
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      // 1. Le sol est dessiné sous toutes les cases
      ctx.drawImage(imgsSol[variantesSol[y][x]], px, py, TILE_SIZE, TILE_SIZE);

      const couleurSpawn = spawnParCase.get(`${x},${y}`);
      if (couleurSpawn) {
        ctx.drawImage(imgsSpawn[couleurSpawn], px, py, TILE_SIZE, TILE_SIZE);
      }

      // 2. Puis l'élément par-dessus
      const variante = blocsDetruits.get(`${x},${y}`);
      if (tile === 0 && variante !== undefined) {
        ctx.drawImage(imgsDecombres[variante], px, py, TILE_SIZE, TILE_SIZE);
      }
      if (tile === 1) {
        const estBordure =
          x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1;

        // Fond marron pour les murs intérieurs uniquement
        ctx.fillStyle = "#6b4226";
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        ctx.drawImage(
          estBordure ? imgBordure : imgMur,
          px,
          py,
          TILE_SIZE,
          TILE_SIZE,
        ); // pour différencier les murs de bordure des murs intérieurs
      } else if (tile === 2) {
        ctx.drawImage(imgBloc, px, py, TILE_SIZE, TILE_SIZE);
      }

      ctx.strokeStyle = "#333";
      ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
    });
  });
}

function getSpawnPosition(playerIndex = 0) {
  const tile = SPAWN_TILES[playerIndex % SPAWN_TILES.length];

  // Keep the spawn tile clear of walls or blocks.
  map[tile.y][tile.x] = 0;

  return {
    x: tile.x * TILE_SIZE,
    y: tile.y * TILE_SIZE,
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

    if (
      map[y][x] === 0 &&
      !isNearSpawn &&
      Math.random() < DESTRUCTIBLE_WALL_CHANCE
    ) {
      map[y][x] = 2;
    }
  }
}

function isBlockedAtPixel(x, y) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  return map[tileY]?.[tileX] !== 0; // also blocks outside the map
}
