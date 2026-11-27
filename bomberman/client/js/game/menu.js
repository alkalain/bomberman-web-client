// =========================================================================
// 1. GESTION DES GRENOUILLES ANIMÉES EN ARRIÈRE-PLAN
// =========================================================================

// Écouteur global qui déclenche l'animation de fond dès que le DOM est chargé
document.addEventListener("DOMContentLoaded", () => {
    // Lancement des grenouilles de toutes les couleurs en arrière-plan
    initBackgroundFrogs();
});

// Première version de la fonction (sera écrasée par la seconde déclaration plus bas)
function initBackgroundFrogs() {
    const bgContainer = document.getElementById("frogs-background");
    if (!bgContainer) return;

    // Liste de toutes tes couleurs de dossiers (ex: "bleu", "vert", "rouge", etc.)
    const colors = ["bleu", "vert", "rouge"]; 
    const directions = ["bas", "haut", "gauche", "droite"];
    const numberOfFrogs = 8; // Nombre de grenouilles en fond

    for (let i = 0; i < numberOfFrogs; i++) {
        createImgFrog(bgContainer, colors, directions);
    }
}

// Fonction utilitaire pour créer et animer une grenouille individuelle dans le DOM
function createImgFrog(container, colors, directions) {
    const frog = document.createElement("img");
    frog.classList.add("bg-frog");

    // Sélection aléatoire d'une couleur et d'une direction initiale
    const color = colors[Math.floor(Math.random() * colors.length)];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    
    // Position aléatoire initiale sur l'écran
    let posX = Math.random() * window.innerWidth;
    let posY = Math.random() * window.innerHeight;
    
    let speedX = 0;
    let speedY = 0;
    if (dir === "droite") speedX = 1;
    if (dir === "gauche") speedX = -1;
    if (dir === "bas") speedY = 1;
    if (dir === "haut") speedY = -1;

    let frame = 1;

    // Attribution de l'image initiale de la grenouille
    frog.src = `img/${color}/${dir}1.png`;
    frog.style.left = `${posX}px`;
    frog.style.top = `${posY}px`;

    // Boucle d'intervalle (250ms) pour animer le mouvement et alterner les sprites (frame 1 et 2)
    setInterval(() => {
        frame = frame === 1 ? 2 : 1;
        frog.src = `img/${color}/${dir}${frame}.png`;

        posX += speedX;
        posY += speedY;

        // Boucle de réapparition aux bords de l'écran (effet "screen wrapping")
        if (posX > window.innerWidth + 50) posX = -50;
        if (posX < -50) posX = window.innerWidth + 50;
        if (posY > window.innerHeight + 50) posY = -50;
        if (posY < -50) posY = window.innerHeight + 50;

        frog.style.left = `${posX}px`;
        frog.style.top = `${posY}px`;
    }, 250);

    container.appendChild(frog);
}

// Seconde version de la fonction initBackgroundFrogs (qui remplace la première)
function initBackgroundFrogs() {
    const bgContainer = document.getElementById("frogs-background");
    if (!bgContainer) return;

    const colors = ["bleu", "vert", "rouge", "jaune"]; // Couleurs disponibles
    const directions = ["bas", "haut", "gauche", "droite"]; // Vues / orientations des grenouilles
    
    const numberOfFrogs = 72; // Nombre total de grenouilles affichées en arrière-plan

    for (let i = 0; i < numberOfFrogs; i++) {
        createImgFrog(bgContainer, colors, directions);
    }
}


// =========================================================================
// 2. MINI-ARÈNE INTERACTIVE DES RÈGLES DU JEU
// =========================================================================

// Second écouteur DOMContentLoaded pour initialiser la logique du simulateur des règles
document.addEventListener("DOMContentLoaded", function () {
  // Définition de la grille initiale : 
  // 0 = eau/nénuphar, 1 = rocher indestructible, 2 = roseau destructible, 3 = bonus feu
  const initialLayout = [
    [0, 0, 2, 0, 2, 0, 0],
    [0, 1, 0, 1, 0, 1, 0],
    [2, 0, 2, 0, 2, 0, 2],
    [0, 1, 0, 1, 0, 1, 0],
    [0, 0, 2, 0, 2, 0, 0]
  ];

  let grid = [];
  let frog = { x: 0, y: 0 }; // Position initiale de la grenouille test
  let bomb = null;           // État de la bombe active
  let flames = [];           // Liste des cases touchées par le feu
  let range = 1;             // Portée initiale des explosions

  const container = document.getElementById("bc-demo-grid");
  const statusEl = document.getElementById("bc-demo-status");

  // Fonction de rendu visuel de la mini-grille dans le DOM
  function renderDemo() {
    if (!container) return;
    container.innerHTML = "";
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 7; x++) {
        const cell = document.createElement("div");
        cell.className = "bc-cell";
        const isFlame = flames.some(f => f.x === x && f.y === y);

        // Attribution des émojis et classes CSS selon l'état de chaque cellule
        if (grid[y][x] === 1) {
          cell.classList.add("rock");
          cell.textContent = "🪨";
        } else if (isFlame) {
          cell.classList.add("flame");
          cell.textContent = "💥";
        } else if (frog.x === x && frog.y === y) {
          cell.textContent = "🐸";
        } else if (bomb && bomb.x === x && bomb.y === y) {
          cell.textContent = "💣";
        } else if (grid[y][x] === 2) {
          cell.classList.add("reed");
          cell.textContent = "🌾";
        } else if (grid[y][x] === 3) {
          cell.textContent = "🔥";
        }
        container.appendChild(cell);
      }
    }
  }

  // Réinitialisation complète de la mini-arène de démonstration
  function resetDemo() {
    grid = initialLayout.map(row => [...row]);
    frog = { x: 0, y: 0 };
    bomb = null;
    flames = [];
    range = 1;
    if (statusEl) {
      statusEl.textContent = "Déplacez la grenouille et posez une nenuf-bombe près des roseaux 🌾 !";
    }
    renderDemo();
  }

  // Gestion du déplacement de la grenouille dans la mini-grille
  function moveFrog(dx, dy) {
    const nx = frog.x + dx;
    const ny = frog.y + dy;
    // Vérification des limites de la grille (7x5)
    if (nx < 0 || nx >= 7 || ny < 0 || ny >= 5) return;
    // Empêche de traverser les rochers (1) et les roseaux (2)
    if (grid[ny][nx] === 1 || grid[ny][nx] === 2) return;
    // Empêche de marcher sur la case occupée par une bombe active
    if (bomb && bomb.x === nx && bomb.y === ny) return;

    frog.x = nx;
    frog.y = ny;

    // Vérification du ramassage d'un bonus feu (3)
    if (grid[ny][nx] === 3) {
      grid[ny][nx] = 0;
      range = 2; // Augmente la portée de l'explosion
      if (statusEl) {
        statusEl.textContent = "🔥 Bonus Croassement Ardent ramassé ! Portée des bombes passée à 2 cases.";
      }
    }
    renderDemo();
  }

  // Logique de pose et de détonation d'une nenuf-bombe
  function placeBomb() {
    if (bomb) return; // Une seule bombe à la fois dans la démo
    bomb = { x: frog.x, y: frog.y };
    if (statusEl) {
      statusEl.textContent = "⏳ Tic-tac... Éloignez-vous de la bombe avant la détonation !";
    }
    renderDemo();

    // Minuteur simulant le délai avant l'explosion (1.8 secondes)
    setTimeout(() => {
      if (!bomb) return;
      const bx = bomb.x;
      const by = bomb.y;
      bomb = null;
      flames = [{ x: bx, y: by }]; // Le centre de la bombe s'enflamme

      // Propagation des flammes en croix (Haut, Bas, Gauche, Droite) selon la portée
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      dirs.forEach(([dx, dy]) => {
        for (let step = 1; step <= range; step++) {
          const tx = bx + dx * step;
          const ty = by + dy * step;
          if (tx < 0 || tx >= 7 || ty < 0 || ty >= 5) break; // Arrêt hors limites
          if (grid[ty][tx] === 1) break;                     // Arrêt sur rocher indestructible
          flames.push({ x: tx, y: ty });
          if (grid[ty][tx] === 2) {                          // Roseau touché : détruit avec chance de faire apparaître un bonus (3) ou de l'eau (0)
            grid[ty][tx] = Math.random() < 0.6 ? 3 : 0;
            break; // L'explosion s'arrête après avoir touché un roseau
          }
        }
      });

      // Vérification si la grenouille a été piégée par les flammes
      const hitFrog = flames.some(f => f.x === frog.x && f.y === frog.y);
      if (statusEl) {
        statusEl.textContent = hitFrog
          ? "😵 Oups ! Votre grenouille a été touchée par le souffle. Reculez la prochaine fois !"
          : "💥 Boum ! Roseau détruit. Ramassez le bonus 🔥 s'il est apparu !";
      }
      renderDemo();

      // Disparition des flammes après 650 millisecondes
      setTimeout(() => {
        flames = [];
        renderDemo();
      }, 650);
    }, 1800);
  }

  // Liaison des boutons de contrôle de la démo de l'interface
  const btnUp = document.getElementById("bc-btn-up");
  const btnDown = document.getElementById("bc-btn-down");
  const btnLeft = document.getElementById("bc-btn-left");
  const btnRight = document.getElementById("bc-btn-right");
  const btnBomb = document.getElementById("bc-btn-bomb");
  const btnReset = document.getElementById("bc-btn-reset");

  if (btnUp) btnUp.addEventListener("click", () => moveFrog(0, -1));
  if (btnDown) btnDown.addEventListener("click", () => moveFrog(0, 1));
  if (btnLeft) btnLeft.addEventListener("click", () => moveFrog(-1, 0));
  if (btnRight) btnRight.addEventListener("click", () => moveFrog(1, 0));
  if (btnBomb) btnBomb.addEventListener("click", placeBomb);
  if (btnReset) btnReset.addEventListener("click", resetDemo);

  // Gestion des contrôles clavier (actifs uniquement lorsque l'écran des règles est visible)
  document.addEventListener("keydown", function (e) {
    const rulesScreen = document.getElementById("rules-screen");
    if (!rulesScreen || rulesScreen.classList.contains("hidden")) return;

    if (e.key === "ArrowUp" || e.key === "z" || e.key === "Z") {
      e.preventDefault();
      moveFrog(0, -1);
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      e.preventDefault();
      moveFrog(0, 1);
    } else if (e.key === "ArrowLeft" || e.key === "q" || e.key === "Q") {
      e.preventDefault();
      moveFrog(-1, 0);
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      e.preventDefault();
      moveFrog(1, 0);
    } else if (e.key === " ") {
      e.preventDefault();
      placeBomb();
    }
  });

  // Initialisation au chargement de la démo
  resetDemo();
});


// =========================================================================
// 3. NAVIGATION ENTRE LES ÉCRANS DU JEU (MENU PRINCIPAL / RÈGLES)
// =========================================================================

// Récupération des éléments du DOM pour la gestion des écrans
const btnRules = document.getElementById("btn-rules");
const btnBackFromRules = document.getElementById("btn-back-from-rules");
const menuScreen = document.getElementById("menu-screen");
const rulesScreen = document.getElementById("rules-screen");

// Événement : Affichage de l'écran des règles au clic sur le bouton du menu principal
if (btnRules && menuScreen && rulesScreen) {
  btnRules.addEventListener("click", () => {
    menuScreen.classList.add("hidden");
    rulesScreen.classList.remove("hidden");
  });
}

// Événement : Retour au menu principal au clic sur le bouton de sortie des règles
if (btnBackFromRules && menuScreen && rulesScreen) {
  btnBackFromRules.addEventListener("click", () => {
    rulesScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
}