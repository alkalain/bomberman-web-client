import { GameView } from "./view/GameView.js";
import { Personnage } from "./model/entities/Personnage.js";
import { SPAWN_COULEUR, GameMap } from "./model/map.js";
import { Bomb } from "./model/entities/Bomb.js";
import { PowerUp, CHANCE_DROP, tirerType } from "./model/entities/PowerUp.js";
import { chargerAssets } from "./view/assets.js";

const canvas = document.getElementById("game");

// ---------- Dimentions ----------
const LARGEUR = canvas.width;
const HAUTEUR = canvas.height;
canvas.height = (LARGEUR / 100) * 86;
// ---------- Charge la Map ----------
const gameMap = new GameMap();

// ---------- Chargement des images ----------
const {
  sprites,
  apercus,
  couleurs,
  bombSprites,
  map: mapAssets,
} = chargerAssets();

// ---------- rendering game ----------
const gameView = new GameView(canvas);

// ---------- Bombes ----------
const COOLDOWN_BOMBE = 2000; // 2 s entre deux dépôts
const MAX_BOMBES = 10;
let bombes = [];
let items = []; // item bonus

// ---------- État général ----------
let etat = "selection"; // "selection" ou "jeu"
let choix = 0; // index de la couleur survolée

// ---------- Le personnage (créé après le choix) ----------
const perso = new Personnage({
  col: 100,
  row: 100,
  vitesse: 3,
  couleur: "bleu",
  gameMap,
  isBombAtPixel,
  getBombes: () => bombes,
  BombClass: Bomb,
  cooldownBombe: COOLDOWN_BOMBE,
});

const tileSize = gameMap.tileSize;
function demarrerJeu() {
  etat = "jeu";

  perso.setCouleur(couleurs[choix]);
  // coin de spawn correspondant à la couleur choisie
  const spawn = gameMap.getSpawnPosition(SPAWN_COULEUR[perso.couleur] ?? 0);

  perso.setSpawn(spawn.x, spawn.y);

  perso.setDirection("bas");
  perso.setFrame(0);
  perso.setCompteur(0);

  perso.setBombesRestantes(MAX_BOMBES);

  bombes = []; // on vide les bombes de la partie précédente
  items = []; // on vide les items de la partie précédente
}

// ---------- Clavier ----------
const touches = {};

window.addEventListener("keydown", (e) => {
  if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();

  if (etat === "selection") {
    if (e.key === "ArrowRight") choix = (choix + 1) % couleurs.length;
    if (e.key === "ArrowLeft")
      choix = (choix - 1 + couleurs.length) % couleurs.length;
    if (e.key === "Enter" || e.key === " ") demarrerJeu();
  } else {
    if (!perso.getVivant()) {
      if (e.key === "Enter") {
        for (const k in touches) touches[k] = false;
        etat = "selection"; // retour au choix du personnage
      }
      return;
    }
    touches[e.key] = true;
    if (e.key === " ") perso.poserBombe();
  }
});

window.addEventListener("keyup", (e) => (touches[e.key] = false));

// ---------- Souris (clic sur une couleur) ----------
const ESPACE = 150; // distance entre deux persos
const DEBUT_X = canvas.width / 2 - (ESPACE * (couleurs.length - 1)) / 2;

canvas.addEventListener("click", (e) => {
  if (etat !== "selection") return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  couleurs.forEach((c, i) => {
    const centre = DEBUT_X + i * ESPACE;
    if (Math.abs(mx - centre) < ESPACE / 2) {
      if (choix === i)
        demarrerJeu(); // 2e clic sur la même couleur = valider
      else choix = i;
    }
  });
});

// ---------- Bombes : logique ----------

function appliquerDegats(cases) {
  if (!perso.getVivant()) return;

  const p = perso.caseDuPerso();
  if (cases.some((c) => c.col === p.col && c.row === p.row)) {
    perso.prendreDegat();
    console.log("Touché ! Vies restantes :", perso.getVies());
  }
}

function updateBombes() {
  const now = performance.now();
  for (const b of bombes) {
    if (b.update(now)) {
      appliquerDegats(b.cases);
      // pour chaque bloc détruit par cette explosion, peut-être un item
      for (const c of b.blocsDetruits) {
        if (Math.random() < CHANCE_DROP) {
          items.push(new PowerUp(c.col, c.row, tirerType()));
        }
      }
    }
    // Dès que le joueur est sorti de la case, la bombe devient solide
    if (!b.solide && b.etat !== "explosion" && !persoChevauche(b)) {
      b.solide = true;
    }
  }
  bombes = bombes.filter((b) => !b.estTerminee(now));
}

//fonction pour les items bonus/malus
function updateItems() {
  if (!perso.getVivant()) return;

  const { col, row } = perso.caseDuPerso();
  const i = items.findIndex((it) => it.col === col && it.row === row);
  if (i === -1) return; // pas d'item sur cette case

  const item = items[i];
  console.log("Ramassé :", item.type); // juste pour vérifier
  items.splice(i, 1); // on retire l'item de la map
}

// Y a-t-il une bombe solide à ce pixel ?
function isBombAtPixel(x, y) {
  const col = Math.floor(x / tileSize);
  const row = Math.floor(y / tileSize);
  return bombes.some((b) => b.solide && b.col === col && b.row === row);
}

// ---------- HITBOXES ----------

// La hitbox du joueur chevauche-t-elle la case de la bombe ?
function persoChevauche(b) {
  const h = perso.hitbox();
  const bx = b.col * tileSize;
  const by = b.row * tileSize;
  return (
    h.left < bx + tileSize &&
    h.right > bx &&
    h.top < by + tileSize &&
    h.bottom > by
  );
}

// ---------- Boucle principale ----------
function loop() {
  //ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (etat === "selection") {
    gameView.drawSelection({
      couleurs: couleurs,
      choix: choix,
      apercus: apercus,
    });
  } else {
    perso.update(touches);
    updateBombes();
    updateItems();
    gameView.drawJeu({
      perso: perso,
      bombes: bombes,
      items: items,
      gameMap: gameMap,
      mapAssets: mapAssets,
      sprites: sprites,
      bombSprites: bombSprites,
    });
  }

  requestAnimationFrame(loop);
}
loop();
