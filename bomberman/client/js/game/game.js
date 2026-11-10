const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // pour un rendu pixel-art

// ---------- Dimentions ----------
const LARGEUR = canvas.width;
const HAUTEUR = canvas.height;
canvas.height = (LARGEUR / 100) * 86;

// ---------- Chargement des images ----------
const couleurs = ["bleu", "rose", "rouge", "jaune"];
const directions = ["droite", "gauche", "haut", "bas"];

function charger(src) {
  const img = new Image();
  img.src = src;
  img.onerror = () => console.error("Image introuvable : " + img.src);
  return img;
}

// sprites[couleur][direction] = [image1, image2]
// apercus[couleur] = [image1, image2, image3]
const sprites = {};
const apercus = {};

for (const c of couleurs) {
  sprites[c] = {};
  for (const d of directions) {
    sprites[c][d] = [1, 2].map((n) => charger(`img/${c}/${d}${n}.png`));
  }
  apercus[c] = [1, 2, 3].map((n) => charger(`img/${c}/apercu${n}.png`));
}

// ---------- Bombes ----------
const COOLDOWN_BOMBE = 2000; // 2 s entre deux dépôts
const MAX_BOMBES = 10;
let bombes = [];

// ---------- État général ----------
let etat = "selection"; // "selection" ou "jeu"
let choix = 0; // index de la couleur survolée
let horlogeSelection = 0; // fait animer le perso sélectionné

// ---------- Le personnage (créé après le choix) ----------
const perso = {
  x: 100,
  y: 100,
  vitesse: 3,
  couleur: null,
  direction: "bas",
  frame: 0,
  compteur: 0,
  vitesseAnim: 10,
  vies: 3,
  bombesRestantes: MAX_BOMBES,
  dernierDepot: -Infinity,
  vivant: true,
};

function demarrerJeu() {
  perso.couleur = couleurs[choix];

  const spawn = getSpawnPosition(SPAWN_COULEUR[perso.couleur] ?? 0); // coin de spawn correspondant à la couleur choisie
  perso.x = spawn.x;
  perso.y = spawn.y;

  perso.direction = "bas";
  perso.frame = 0;
  perso.compteur = 0;
  etat = "jeu";
  perso.vivant = true;

  perso.vies = 3;
  perso.bombesRestantes = MAX_BOMBES;
  perso.dernierDepot = -Infinity;
  bombes = [];
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
    if (!perso.vivant) {
      if (e.key === "Enter") {
        for (const k in touches) touches[k] = false;
        etat = "selection"; // retour au choix du personnage
      }
      return;
    }
    touches[e.key] = true;
    if (e.key === " ") poserBombe();
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
// Case du joueur, calculée depuis le centre de sa hitbox (x+20, y+20)
function caseDuPerso() {
  return {
    col: Math.floor((perso.x + 20) / TILE_SIZE),
    row: Math.floor((perso.y + 20) / TILE_SIZE),
  };
}

function poserBombe() {
  if (!perso.vivant) return;
  const now = performance.now();
  if (perso.bombesRestantes <= 0) return;
  if (now - perso.dernierDepot < COOLDOWN_BOMBE) return;

  const { col, row } = caseDuPerso();
  if (bombes.some((b) => b.col === col && b.row === row)) return;

  bombes.push(new Bomb(col, row, now, perso));
  perso.bombesRestantes--;
  perso.dernierDepot = now;
}

function appliquerDegats(cases) {
  if (!perso.vivant) return;

  const p = caseDuPerso();
  if (cases.some((c) => c.col === p.col && c.row === p.row)) {
    perso.vies--;
    console.log("Touché ! Vies restantes :", perso.vies);

    if (perso.vies <= 0) {
      perso.vies = 0;
      perso.vivant = false; // le perso disparaît
    }
  }
}

function updateBombes() {
  const now = performance.now();
  for (const b of bombes) {
    if (b.update(now)) appliquerDegats(b.cases);
    // Dès que le joueur est sorti de la case, la bombe devient solide
    if (!b.solide && b.etat !== "explosion" && !persoChevauche(b)) {
      b.solide = true;
    }
  }
  bombes = bombes.filter((b) => !b.estTerminee(now));
}


// Y a-t-il une bombe solide à ce pixel ?
function isBombAtPixel(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  return bombes.some((b) => b.solide && b.col === col && b.row === row);
}

// ---------- HITBOXES ----------
// Hitbox du joueur (même valeurs que dans canMoveTo : décalage 8, taille 24)
function hitboxPerso() {
  return {
    left: perso.x + 8,
    right: perso.x + 8 + 24,
    top: perso.y + 8,
    bottom: perso.y + 8 + 24,
  };
}

// La hitbox du joueur chevauche-t-elle la case de la bombe ?
function persoChevauche(b) {
  const h = hitboxPerso();
  const bx = b.col * TILE_SIZE;
  const by = b.row * TILE_SIZE;
  return (
    h.left < bx + TILE_SIZE &&
    h.right > bx &&
    h.top < by + TILE_SIZE &&
    h.bottom > by
  );
}

// Collision joueur
function canMoveTo(x, y) {
  const left = x + 8;
  const right = x + 8 + 24 - 1;
  const top = y + 8;
  const bottom = y + 8 + 24 - 1;

  return !(
    isBlockedAtPixel(left, top) ||
    isBlockedAtPixel(right, top) ||
    isBlockedAtPixel(left, bottom) ||
    isBlockedAtPixel(right, bottom) ||
    isBombAtPixel(left, top) ||
    isBombAtPixel(right, top) ||
    isBombAtPixel(left, bottom) ||
    isBombAtPixel(right, bottom)
  );
}

// ---------- Mise à jour du jeu ----------
function updateJeu() {
  if (!perso.vivant) return; // un mort ne bouge plus
  let dx = 0;
  let dy = 0;
  let dir = null;

  if (touches["ArrowRight"]) {
    dx = perso.vitesse;
    dir = "droite";
  } else if (touches["ArrowLeft"]) {
    dx = -perso.vitesse;
    dir = "gauche";
  } else if (touches["ArrowUp"]) {
    dy = -perso.vitesse;
    dir = "haut";
  } else if (touches["ArrowDown"]) {
    dy = perso.vitesse;
    dir = "bas";
  }

  const oldX = perso.x;
  const oldY = perso.y;

  // Check each axis separately to allow sliding along walls.
  if (dx !== 0 && canMoveTo(perso.x + dx, perso.y)) {
    perso.x += dx;
  }
  if (dy !== 0 && canMoveTo(perso.x, perso.y + dy)) {
    perso.y += dy;
  }

  const moved = perso.x !== oldX || perso.y !== oldY;

  if (dir) {
    if (dir !== perso.direction) {
      perso.direction = dir;
      perso.frame = 0;
      perso.compteur = 0;
    }

    if (moved) {
      perso.compteur++;
      if (perso.compteur >= perso.vitesseAnim) {
        perso.compteur = 0;
        perso.frame = (perso.frame + 1) % 2;
      }
    } else {
      perso.frame = 0;
      perso.compteur = 0;
    }
  } else {
    perso.frame = 0;
    perso.compteur = 0;
  }
}

// ----------  Dessin ----------
const TAILLE_SELECTION = 96; // taille d'affichage dans l'écran de choix (à adapter)

function drawSelection() {
  horlogeSelection++;

  ctx.fillStyle = "#222";
  ctx.font = "32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Choisis ton personnage", canvas.width / 2, 80);

  couleurs.forEach((c, i) => {
    const centreX = DEBUT_X + i * ESPACE;
    const centreY = 250;
    const selectionne = i === choix;

    // Le perso sélectionné s'anime (alterne 2 images), les autres restent fixes
    const frame = selectionne
      ? Math.floor(horlogeSelection / 30) % apercus[c].length
      : 0;
    const img = apercus[c][frame];

    const taille = selectionne ? TAILLE_SELECTION * 1.3 : TAILLE_SELECTION;

    // Cadre autour du perso sélectionné
    if (selectionne) {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 4;
      ctx.strokeRect(centreX - 80, centreY - 100, 160, 200);
    }

    ctx.globalAlpha = selectionne ? 1 : 0.6;
    ctx.drawImage(
      img,
      centreX - taille / 2,
      centreY - taille / 2,
      taille,
      taille,
    );
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#222";
    ctx.font = selectionne ? "bold 20px sans-serif" : "18px sans-serif";
    ctx.fillText(c, centreX, centreY + 130);
  });

  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#555";
  ctx.fillText(
    "← →  pour choisir      Entrée  pour valider",
    canvas.width / 2,
    440,
  );
}

// Dessin des bombes et flammes
function drawBombes() {
  const now = performance.now();
  for (const b of bombes) b.draw(ctx, now);
}


// ---------- HUD ----------
function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `Vies : ${perso.vies}   Bombes : ${perso.bombesRestantes}`,
    10,
    canvas.height - 10,
  );
}

function drawJeu() {
  drawMap(ctx);
  drawBombes(); // bombes et flammes sous le perso
  if (perso.vivant) {
    const img = sprites[perso.couleur][perso.direction][perso.frame];
    ctx.drawImage(img, perso.x, perso.y);
  }
  drawHUD();
  if (!perso.vivant) drawMort();
}

function drawMort() {
  // Voile sombre sur toute la map
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e63946";
  ctx.font = "bold 64px sans-serif";
  ctx.fillText("TU ES MORT", canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = "white";
  ctx.font = "22px sans-serif";
  ctx.fillText(
    "Appuie sur Entrée pour rejouer",
    canvas.width / 2,
    canvas.height / 2 + 50,
  );
}

// ---------- Boucle principale ----------
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (etat === "selection") {
    drawSelection();
  } else {
    updateJeu();
    updateBombes();
    drawJeu();
  }

  requestAnimationFrame(loop);
}
loop();
