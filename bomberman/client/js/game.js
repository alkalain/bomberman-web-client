const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------- Chargement des images ----------
const couleurs = ["bleu", "vert", "rouge", "rose", "jaune"];
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
    sprites[c][d] = [1, 2].map(n => charger(`img/${c}/${d}${n}.png`));
  }
  apercus[c] = [1, 2, 3].map(n => charger(`img/${c}/apercu${n}.png`));
}

// ---------- État général ----------
let etat = "selection";   // "selection" ou "jeu"
let choix = 0;            // index de la couleur survolée
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
};

function demarrerJeu() {
  perso.couleur = couleurs[choix];
  perso.direction = "bas";
  perso.frame = 0;
  perso.compteur = 0;
  etat = "jeu";
}

// ---------- Clavier ----------
const touches = {};

window.addEventListener("keydown", e => {
  if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();

  if (etat === "selection") {
    if (e.key === "ArrowRight") choix = (choix + 1) % couleurs.length;
    if (e.key === "ArrowLeft")  choix = (choix - 1 + couleurs.length) % couleurs.length;
    if (e.key === "Enter" || e.key === " ") demarrerJeu();
  } else {
    touches[e.key] = true;
  }
});

window.addEventListener("keyup", e => touches[e.key] = false);

// ---------- Souris (clic sur une couleur) ----------
const ESPACE = 150;                                  // distance entre deux persos
const DEBUT_X = canvas.width / 2 - ESPACE * (couleurs.length - 1) / 2;

canvas.addEventListener("click", e => {
  if (etat !== "selection") return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  couleurs.forEach((c, i) => {
    const centre = DEBUT_X + i * ESPACE;
    if (Math.abs(mx - centre) < ESPACE / 2) {
      if (choix === i) demarrerJeu();   // 2e clic sur la même couleur = valider
      else choix = i;
    }
  });
});

// ---------- Mise à jour du jeu ----------
function updateJeu() {
  let dir = null;

  if (touches["ArrowRight"])     { perso.x += perso.vitesse; dir = "droite"; }
  else if (touches["ArrowLeft"]) { perso.x -= perso.vitesse; dir = "gauche"; }
  else if (touches["ArrowUp"])   { perso.y -= perso.vitesse; dir = "haut"; }
  else if (touches["ArrowDown"]) { perso.y += perso.vitesse; dir = "bas"; }

  if (dir) {
    if (dir !== perso.direction) {
      perso.direction = dir;
      perso.frame = 0;
      perso.compteur = 0;
    }
    perso.compteur++;
    if (perso.compteur >= perso.vitesseAnim) {
      perso.compteur = 0;
      perso.frame = (perso.frame + 1) % 2;
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
    const frame = selectionne ? Math.floor(horlogeSelection / 30) % apercus[c].length : 0;
    const img = apercus[c][frame];

    const taille = selectionne ? TAILLE_SELECTION * 1.3 : TAILLE_SELECTION;

    // Cadre autour du perso sélectionné
    if (selectionne) {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 4;
      ctx.strokeRect(centreX - 80, centreY - 100, 160, 200);
    }

    ctx.globalAlpha = selectionne ? 1 : 0.6;
    ctx.drawImage(img, centreX - taille / 2, centreY - taille / 2, taille, taille);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#222";
    ctx.font = selectionne ? "bold 20px sans-serif" : "18px sans-serif";
    ctx.fillText(c, centreX, centreY + 130);
  });

  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#555";
  ctx.fillText("← →  pour choisir      Entrée  pour valider", canvas.width / 2, 440);
}

function drawJeu() {
  const img = sprites[perso.couleur][perso.direction][perso.frame];
  ctx.drawImage(img, perso.x, perso.y);
}

// ---------- Boucle principale ----------
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (etat === "selection") {
    drawSelection();
  } else {
    updateJeu();
    drawJeu();
  }

  requestAnimationFrame(loop);
}
loop();