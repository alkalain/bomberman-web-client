import { GameView } from "./view/GameView.js";
import { Personnage } from "./model/entities/Personnage.js";
import { SPAWN_COULEUR, GameMap } from "./model/map.js";
import { Bomb } from "./model/entities/Bomb.js";
import { PowerUp, CHANCE_DROP } from "./model/entities/PowerUp.js";
import { ITEMS, tirerType, ramasser } from "./model/entities/items.js";
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
  itemSprites,
  map: mapAssets,
} = chargerAssets();

// ---------- rendering game ----------
const gameView = new GameView(canvas);

// ---------- Bombes ----------
const COOLDOWN_BOMBE = 2000; // 2 s entre deux dépôts
const MAX_BOMBES = 10;
let bombes = [];
let items = []; // item bonus
let projectiles = []; // projectiles de la slow bomba
const ennemis = []; // vide pour l'instant, rempli quand il y auras un 2e joueur

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

const SPAWN_INTERVALLE = 8000; // un item toutes les 8 s
const MAX_ITEMS_MAP = 6; // pas plus de 6 items au sol en même temps
let prochainSpawn = 0;

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
  projectiles = []; // on vide les projectiles de la partie précédente

  prochainSpawn = performance.now() + SPAWN_INTERVALLE; // on planifie le premier spawn d'item

  //items.push(new PowerUp(2, 1, "hot")); pour faire spawn des items tests
  //items.push(new PowerUp(1, 2, "wall_bomba"));
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
    if (e.key === "e" || e.key === "E") utiliserObjet(); // touche E pour utiliser un objet
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

function contexte() {
  return { perso, bombes, items, projectiles, gameMap };
}

//fonction pour les items bonus/malus
function updateItems() {
  if (!perso.getVivant()) return;

  const { col, row } = perso.caseDuPerso();
  const i = items.findIndex((it) => it.col === col && it.row === row);
  if (i === -1) return; // pas d'item sur cette case

  if (ramasser(items[i].type, contexte())) items.splice(i, 1); // sinon il reste au sol
}

// pour utiliser un objet avec E
function utiliserObjet() {
  if (!perso.getVivant() || !perso.objet) return;

  const resultat = ITEMS[perso.objet].utiliser(contexte());
  if (resultat !== false) perso.objet = null; // gardé si l'utilisation a échoué
}

// Y a-t-il une bombe solide à ce pixel ?
function isBombAtPixel(x, y) {
  const col = Math.floor(x / tileSize);
  const row = Math.floor(y / tileSize);
  return bombes.some((b) => b.solide && b.col === col && b.row === row);
}

// ----- pour l'item wall slow ---------

function updateProjectiles() {
  projectiles = projectiles.filter((p) => {
    p.x += p.dx;
    p.y += p.dy;
    if (gameMap.isBlockedAtPixel(p.x, p.y)) return false; // mur, bloc ou bord

    for (const e of ennemis) {
      const cx = e.col + gameMap.tileSize / 2;
      const cy = e.row + gameMap.tileSize / 2;
      if (Math.hypot(cx - p.x, cy - p.y) < 25) {
        e.activerEffet("lent", 5000); // ennemi ralenti 5 s
        return false;
      }
    }
    return true;
  });
}

// ------------ pour les items qui spawn solo sur la map ---------------

function updateSpawnItems() {
  const now = performance.now();
  if (!perso.getVivant() || now < prochainSpawn) return;
  prochainSpawn = now + SPAWN_INTERVALLE;

  if (items.length >= MAX_ITEMS_MAP) return;

  // cases libres : sol, sans item, sans bombe, pas sous le joueur
  const p = perso.caseDuPerso();
  const libres = [];
  for (let row = 0; row < gameMap.height; row++) {
    for (let col = 0; col < gameMap.width; col++) {
      if (gameMap.getTileAt(col, row) !== 0) continue;
      if (items.some((it) => it.col === col && it.row === row)) continue;
      if (bombes.some((b) => b.col === col && b.row === row)) continue;
      if (p.col === col && p.row === row) continue;
      libres.push({ col, row });
    }
  }
  if (libres.length === 0) return;

  const c = libres[Math.floor(Math.random() * libres.length)];
  const type = tirerType((n) => ITEMS[n].spawnAuto);
  if (type) items.push(new PowerUp(c.col, c.row, type));
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
    updateSpawnItems();
    updateProjectiles();
    gameView.drawJeu({
      perso: perso,
      bombes: bombes,
      items: items,
      gameMap: gameMap,
      mapAssets: mapAssets,
      sprites: sprites,
      bombSprites: bombSprites,
      itemSprites: itemSprites,
      projectiles: projectiles,
    });
  }

  requestAnimationFrame(loop);
}
loop();
