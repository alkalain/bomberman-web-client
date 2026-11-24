import { Bomb } from "./Bomb.js";

// Chaque item : nom affiché, mode, poids (rareté), et son effet.
// "instantane" -> appliquer(ctx) au ramassage
// "stocke"     -> utiliser(ctx) avec la touche E (renvoie false si impossible)
//
// ctx = { perso, bombes, gameMap } : tout ce dont un effet peut avoir besoin

export const ITEMS = {
  speed_boost: {
    nom: "Speed boost",
    mode: "instantane",
    poids: 20,
    appliquer({ perso }) {
      perso.activerEffet("rapide", 20000); // 20 s
    },
  },

  crotte: {
    nom: "Crotte",
    mode: "stocke",
    poids: 20,
    utiliser({ perso, bombes, gameMap }) {
      const { col, row } = perso.caseDuPerso();
      if (bombes.some((b) => b.col === col && b.row === row)) return false;

      // portée 1, explose après 1 s
      bombes.push(
        new Bomb(col, row, performance.now(), gameMap, perso, {
          portee: 1,
          delai: 1000,
        }),
      );
    },
  },

  vie_plus: {
    nom: "Vie +",
    mode: "instantane",
    poids: 8,
    appliquer({ perso }) {
      perso.setVies(1);
    },
  },

  hot: {
    nom: "Hot",
    mode: "instantane",
    poids: 10,
    appliquer({ perso }) {
      perso.activerHot(5);
    },
  },

  mystere: {
    nom: "Mystery Box",
    mode: "instantane",
    poids: 10,
    appliquer(ctx) {
      // jamais elle-même, et pas d'objet à stocker si l'emplacement est plein
      const type = tirerType(
        (n) =>
          n !== "mystere" &&
          (ITEMS[n].mode === "instantane" || !ctx.perso.objet),
      );
      if (type) ramasser(type, ctx);
    },
  },

  wall_bomba: {
    nom: "Wall bomba",
    mode: "stocke",
    poids: 20,
    utiliser({ perso, bombes, items, gameMap }) {
      const { col, row } = perso.caseDuPerso();

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== 2) continue; // seulement l'anneau
          const c = col + dc;
          const r = row + dr;
          if (bombes.some((b) => b.col === c && b.row === r)) continue;
          if (items.some((it) => it.col === c && it.row === r)) continue;
          gameMap.placeBlockAt(c, r);
        }
      }
    },
  },

  slow_bomba: {
    nom: "Slow bomba",
    mode: "stocke",
    poids: 20,
    utiliser({ perso, projectiles, gameMap }) {
      const vecteurs = {
        droite: [1, 0],
        gauche: [-1, 0],
        haut: [0, -1],
        bas: [0, 1],
      };
      const [vx, vy] = vecteurs[perso.direction];
      const t = gameMap.tileSize;
      projectiles.push({
        x: perso.col + t / 2, // perso.col / perso.row sont en pixels
        y: perso.row + t / 2,
        dx: vx * 8,
        dy: vy * 8,
      });
    },
  },
};

// les poids sont utilisés pour le tirage aléatoire : un item rare a un petit poids, un item courant a un poids plus grand

// Tirage pondéré, avec un filtre optionnel
export function tirerType(filtre = () => true) {
  const noms = Object.keys(ITEMS).filter(filtre);
  if (noms.length === 0) return null;
  const total = noms.reduce((s, n) => s + ITEMS[n].poids, 0);
  let r = Math.random() * total;
  for (const n of noms) {
    r -= ITEMS[n].poids;
    if (r < 0) return n;
  }
  return noms[0];
}

// Ramasse un item. Renvoie false s'il ne peut pas être pris (emplacement plein).
export function ramasser(type, ctx) {
  const def = ITEMS[type];
  if (def.mode === "instantane") {
    def.appliquer(ctx);
    return true;
  }
  if (ctx.perso.objet) return false;
  ctx.perso.objet = type;
  return true;
}
