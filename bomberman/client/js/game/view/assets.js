// importer les assets des items depuis le fichier items.js
import { ITEMS } from "../model/entities/items.js";

const couleurs = ["bleu", "rose", "rouge", "jaune"];
const directions = ["droite", "gauche", "haut", "bas"];

const bombSprites = {
  normale: charger("img/bombe.png"),
  allumee: charger("img/bombe_allumee.png"),
};

const mapAssets = {
  sols: [1, 2, 3, 4].map((n) => charger(`img/map/sol${n}.png`)),
  spawn: Object.fromEntries(
    couleurs.map((couleur) => [
      couleur,
      charger(`img/map/spawn_${couleur}.png`),
    ]),
  ),
  bloc: charger("img/map/bloc.png"),
  decombres: [1, 2, 3, 4, 5].map((n) =>
    charger(`img/map/decombres${n}.png`)
  ),
  mur: charger("img/map/mur.png"),
  bordure: charger("img/map/bordure.png"),
};

function charger(src) {
  const img = new Image();
  img.src = src;
  img.onerror = () => console.error("Image introuvable : " + img.src);
  return img;
}

export function chargerAssets() {
  const sprites = {};
  const apercus = {};

  for (const couleur of couleurs) {
    sprites[couleur] = {};

    for (const direction of directions) {
      sprites[couleur][direction] = [1, 2].map((n) =>
        charger(`img/${couleur}/${direction}${n}.png`)
      );
    }

    apercus[couleur] = [1, 2, 3].map((n) =>
      charger(`img/${couleur}/apercu${n}.png`)
    );
  }

  return { sprites, apercus, couleurs, bombSprites, itemSprites, map: mapAssets };
}

// une image par item : img/items/<clé de ITEMS>.png
const itemSprites = {};
for (const nom in ITEMS) {
  itemSprites[nom] = charger(`img/items/${nom}.png`);
}