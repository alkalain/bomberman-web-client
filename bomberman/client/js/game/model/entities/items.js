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
};

// les poids sont utilisés pour le tirage aléatoire : un item rare a un petit poids, un item courant a un poids plus grand

// Tirage pondéré : un item rare a un petit poids
export function tirerType() {
  const noms = Object.keys(ITEMS);
  const total = noms.reduce((s, n) => s + ITEMS[n].poids, 0);
  let r = Math.random() * total;
  for (const n of noms) {
    r -= ITEMS[n].poids;
    if (r < 0) return n;
  }
  return noms[0];
}
