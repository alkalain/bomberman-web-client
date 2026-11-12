// ============================================================================
// UI/scoreboard.js
// Gestion de l'affichage du classement de fin de partie (4 joueurs)
// ============================================================================

const MAX_PV = 3;

// Configuration des 4 couleurs de joueurs et chemins vers leurs icônes de vie
const CONFIG_COULEURS = {
  bleu: {
    label: "Bleu",
    avatar: "img/bleu/apercu1.png",
    iconeVie: "img/bleu/vie.png",
    iconeAsset: "img/assets-14.png",
    fallbackBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAA1CAYAAADoDQMKAAAAAXNSR0IArs4c6QAAAORJREFUaAXt07ENwjAQQNEzCiuwAaLMHqxBAS2T0IaCNdiDErEBK1AYXcRZluWIIucC9JFQbF9yuXuORfghgAACCCCAAAIIIIAAAggggAACCHwRCMch6j+/rbaWx+eMuzkP154di93uLZQaCdlaPB2C3eBxdW/CilrvVvK4PG0q5TwFHAauIlZPsRu2LPF6Fu9d0OSL9AanQd7A8n4bs9pVPymNO70qpXFvImX+DKyBct1z3uxMaJGvTe9Z62SuvzgTTZpQstq33+JQT24PAQQQQAABBBBAAAEEEEAAAQQQQOBnBd6v2jNuhm8JfAAAAABJRU5ErkJggg=="
  },
  rouge: {
    label: "Rouge",
    avatar: "img/rouge/apercu1.png",
    iconeVie: "img/rouge/vie.png",
    iconeAsset: "img/assets-15.png",
    fallbackBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAA1CAYAAADoDQMKAAAAAXNSR0IArs4c6QAAAOJJREFUaAXt1N0JwjAQwPGz9UkQQSj4kDFcwJFcwQXcxQVcoGP0TRBEEHxRuUrsoQHB5qDIvxCaj4bc/ZpEhAcBBBBAAAEEEEAAAQQQQAABBBBA4IvAWiZ3LfazVJ8d71Mf95mcmqvBbsL1OdR0idi+rVxGqbm/9mVPIgayLOZSh2NsStu+de3XwFAr+jfOofwo71tsqPGLTWA3XbSJxLcm5pFI4a2xP1XeS4jbmdDIV7ODewJuC9gtZc+Gx1bSJLJedVYlFXDuq9WuRx0BBBBAAAEEEEAAAQQQQAABBBD4H4EHIFFGpQKnLVYAAAAASUVORK5CYII="
  },
  jaune: {
    label: "Jaune",
    avatar: "img/jaune/apercu1.png",
    iconeVie: "img/jaune/vie.png",
    iconeAsset: "img/assets-16.png",
    fallbackBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAA1CAYAAADoDQMKAAAAAXNSR0IArs4c6QAAAM1JREFUaAXt09EJgzAQgOGrdINOUdzGJx86Qecq4pNDuIN0iq5gyyknFxH6kisp/EIwl8jl8pmI8CCAAAIIIIAAAggggAACCCCAAAIIfBFoanlr858djfn5ovpa7DxWS7PC92O5Cz7nTmj5rreLPB8vC2UfbxOldry8/RV963ipNSd1+Q109/Vo2TtqI1VSQUDQ93NA1jRl2J3QZdo23CjdTc7IH6lf3IlTzuJ9rqNLPEwStp5fmz4CCCCAAAIIIIAAAggggAACCCDw3wIfWjhawegSCxcAAAAASUVORK5CYII="
  },
  rose: {
    label: "Rose",
    avatar: "img/rose/apercu1.png",
    iconeVie: "img/rose/vie.png",
    iconeAsset: "img/assets-17.png",
    fallbackBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAA1CAYAAADoDQMKAAAAAXNSR0IArs4c6QAAAOdJREFUaAXt00EOgjAQQNGBeA/Wrr2MJu6NV+AAXsG4N9HLuHbNRUQHMziYEhOZLjSfhNBOaZl5pSJcCCCAAAIIIIAAAggggAACCCCAAAIfBDayaPX2r6VifnxKezZlcmquJruvds+hpu4L8bGDXIrU3G9j4UVYIvN2LdfqaF3p+sWr3w8ENEJFLJ/Bbljw8dw2tUTvgi5fum+ENH0Bp9u5W9Oe+kvpeMiH3CLhRbi1BwW8xyP72c6EJrkql5G5jq71F2ciSxFKlvr3cxzq0e1hAAEEEEAAAQQQQAABBBBAAAEEEPhZgTvcsDMGFwUHSAAAAABJRU5ErkJggg=="
  }
};

// ---------- Tableaux fictifs de fin de partie (4 joueurs) ----------
// Chaque joueur possède :
// - nom : pseudo ou identifiant du joueur
// - couleur : "bleu" | "jaune" | "rouge" | "rose"
// - pvRestants : nombre de points de vie à la fin de la partie (0 si mort)
// - ordreMort : 1 pour le 1er mort, 2 pour le 2e mort, 3 pour le 3e mort (null si encore en vie)
// - tempsMort : moment où le joueur a été éliminé (null si encore en vie)
const SCENARIOS_FICTIFS = [
  {
    titre: "Scénario 1 : Fin du temps réglementaire (2 survivants, 2 éliminés)",
    joueurs: [
      { nom: "Joueur 1", couleur: "bleu",  pvRestants: 2, ordreMort: null, tempsMort: null },
      { nom: "Joueur 2", couleur: "jaune", pvRestants: 1, ordreMort: null, tempsMort: null },
      { nom: "Joueur 3", couleur: "rouge", pvRestants: 0, ordreMort: 2,    tempsMort: "01:48" },
      { nom: "Joueur 4", couleur: "rose",  pvRestants: 0, ordreMort: 1,    tempsMort: "00:54" }
    ]
  },
  {
    titre: "Scénario 2 : Victoire par élimination totale (1 survivant, 3 morts)",
    joueurs: [
      { nom: "Joueur 4", couleur: "rose",  pvRestants: 3, ordreMort: null, tempsMort: null },
      { nom: "Joueur 3", couleur: "rouge", pvRestants: 0, ordreMort: 3,    tempsMort: "02:15" },
      { nom: "Joueur 1", couleur: "bleu",  pvRestants: 0, ordreMort: 2,    tempsMort: "01:32" },
      { nom: "Joueur 2", couleur: "jaune", pvRestants: 0, ordreMort: 1,    tempsMort: "00:41" }
    ]
  },
  {
    titre: "Scénario 3 : Aperçu des 4 couleurs en vie (fin au temps)",
    joueurs: [
      { nom: "Joueur 3", couleur: "rouge", pvRestants: 3, ordreMort: null, tempsMort: null },
      { nom: "Joueur 1", couleur: "bleu",  pvRestants: 2, ordreMort: null, tempsMort: null },
      { nom: "Joueur 4", couleur: "rose",  pvRestants: 2, ordreMort: null, tempsMort: null },
      { nom: "Joueur 2", couleur: "jaune", pvRestants: 1, ordreMort: null, tempsMort: null }
    ]
  }
];

let indexScenarioActuel = 0;

/**
 * Trie les 4 joueurs pour déterminer le classement final :
 * 1. Les joueurs encore en vie (pvRestants > 0) sont classés devant les joueurs morts,
 *    du plus grand nombre de PV restants au plus petit.
 * 2. Les joueurs éliminés (pvRestants === 0) sont classés dans l'ordre inverse de leur mort :
 *    celui qui est mort en dernier (ex: 3e mort) est mieux classé que celui qui est mort en 1er.
 */
function trierClassement(joueurs) {
  return [...joueurs].sort((a, b) => {
    const aEnVie = a.pvRestants > 0;
    const bEnVie = b.pvRestants > 0;

    if (aEnVie && !bEnVie) return -1;
    if (!aEnVie && bEnVie) return 1;

    // Si les deux sont en vie : tri décroissant par points de vie restants
    if (aEnVie && bEnVie) {
      return b.pvRestants - a.pvRestants;
    }

    // Si les deux sont morts : celui qui a un ordreMort plus élevé est mort plus tard -> mieux classé
    return (b.ordreMort || 0) - (a.ordreMort || 0);
  });
}

/**
 * Formate le texte de l'ordre d'élimination ("Mort en 1er", "Mort en 2e", etc.)
 */
function formaterOrdreMort(ordreMort) {
  if (!ordreMort || ordreMort <= 0) return "Éliminé";
  if (ordreMort === 1) return "💀 Mort en 1er";
  return `💀 Mort en ${ordreMort}e`;
}

/**
 * Formate le libellé du rang (1er, 2e, 3e, 4e)
 */
function formaterRang(rang) {
  if (rang === 1) return "🥇 1er";
  if (rang === 2) return "🥈 2e";
  if (rang === 3) return "🥉 3e";
  return `${rang}e`;
}

/**
 * Crée une icône de point de vie (image de la couleur du joueur) avec repli automatique
 */
function creerIconeVie(couleur, estPerdue = false) {
  const conf = CONFIG_COULEURS[couleur] || CONFIG_COULEURS.bleu;

  const slot = document.createElement("span");
  slot.className = "life-icon-slot" + (estPerdue ? " lost" : "");
  slot.title = estPerdue ? "Point de vie perdu" : `Point de vie (${conf.label})`;

  const img = document.createElement("img");
  img.className = "life-icon";
  img.alt = `Vie ${conf.label}`;
  img.src = conf.iconeVie;

  // Si l'image n'est pas trouvée dans img/<couleur>/vie.png, essaie img/assets-XX.png puis le Base64
  let tentative = 0;
  img.onerror = () => {
    tentative++;
    if (tentative === 1 && conf.iconeAsset) {
      img.src = conf.iconeAsset;
    } else {
      img.onerror = null;
      img.src = conf.fallbackBase64;
    }
  };

  slot.appendChild(img);
  return slot;
}

/**
 * Génère et affiche le tableau du scoreboard dans le DOM
 */
function afficherScoreboard(joueurs = SCENARIOS_FICTIFS[indexScenarioActuel].joueurs, sousTitre = null) {
  const tbody = document.getElementById("scoreboard-body");
  const overlay = document.getElementById("scoreboard-overlay");
  const subtitleEl = document.getElementById("scoreboard-subtitle");

  if (!tbody || !overlay) return;

  if (subtitleEl) {
    subtitleEl.textContent = sousTitre || SCENARIOS_FICTIFS[indexScenarioActuel].titre;
  }

  tbody.innerHTML = "";
  const classement = trierClassement(joueurs);

  classement.forEach((joueur, index) => {
    const rang = index + 1;
    const enVie = joueur.pvRestants > 0;
    const conf = CONFIG_COULEURS[joueur.couleur] || CONFIG_COULEURS.bleu;

    const tr = document.createElement("tr");
    tr.className = `row-rank-${rang} ${enVie ? "row-alive" : "row-dead"}`;

    // 1. Cellule Rang
    const tdRang = document.createElement("td");
    tdRang.className = "col-rang";
    const badgeRang = document.createElement("span");
    badgeRang.className = `rank-badge rank-${rang}`;
    badgeRang.textContent = formaterRang(rang);
    tdRang.appendChild(badgeRang);

    // 2. Cellule Joueur (avatar + nom + couleur)
    const tdJoueur = document.createElement("td");
    tdJoueur.innerHTML = `
      <div class="player-cell">
        <div class="player-avatar-box border-${joueur.couleur}">
          <img class="player-avatar" src="${conf.avatar}" alt="Avatar ${joueur.nom}" />
        </div>
        <div class="player-info">
          <span class="player-name">${joueur.nom}</span>
          <span class="player-color-tag color-${joueur.couleur}">
            <span class="color-dot"></span>
            Personnage ${conf.label}
          </span>
        </div>
      </div>
    `;

    // 3. Cellule Statut / Ordre de mort
    const tdStatut = document.createElement("td");
    if (enVie) {
      const estVainqueur = rang === 1;
      tdStatut.innerHTML = `
        <span class="status-badge ${estVainqueur ? "status-alive-winner" : "status-alive"}">
          ${estVainqueur ? "👑 En vie (Vainqueur)" : "✅ En vie (Survivant)"}
        </span>
      `;
    } else {
      const texteOrdre = formaterOrdreMort(joueur.ordreMort);
      const texteTemps = joueur.tempsMort
        ? `<span class="death-time">Éliminé à ${joueur.tempsMort}</span>`
        : "";
      tdStatut.innerHTML = `
        <span class="status-badge status-dead">${texteOrdre}</span>
        ${texteTemps}
      `;
    }

    // 4. Cellule Points de vie restants (avec les images envoyées)
    const tdPv = document.createElement("td");
    const containerPv = document.createElement("div");
    containerPv.className = "lives-container";

    const iconsWrapper = document.createElement("div");
    iconsWrapper.className = "lives-icons";

    const pvActuels = Math.max(0, Math.min(MAX_PV, joueur.pvRestants));

    // Affiche les images de vie restantes (en couleur) puis les vies perdues (grisées)
    for (let i = 0; i < MAX_PV; i++) {
      const estPerdue = i >= pvActuels;
      iconsWrapper.appendChild(creerIconeVie(joueur.couleur, estPerdue));
    }

    const textePv = document.createElement("span");
    textePv.className = "lives-count-text";
    textePv.textContent = enVie ? `${pvActuels} / ${MAX_PV} PV` : "0 PV (Mort)";

    containerPv.appendChild(iconsWrapper);
    containerPv.appendChild(textePv);
    tdPv.appendChild(containerPv);

    tr.appendChild(tdRang);
    tr.appendChild(tdJoueur);
    tr.appendChild(tdStatut);
    tr.appendChild(tdPv);

    tbody.appendChild(tr);
  });

  overlay.classList.remove("hidden");
}

/**
 * Masque la fenêtre du scoreboard
 */
function masquerScoreboard() {
  const overlay = document.getElementById("scoreboard-overlay");
  if (overlay) overlay.classList.add("hidden");
}

// ---------- Initialisation et écouteurs d'événements ----------
document.addEventListener("DOMContentLoaded", () => {
  const btnOpen = document.getElementById("btn-open-scoreboard");
  const btnClose = document.getElementById("btn-close-scoreboard");
  const btnScenario = document.getElementById("btn-switch-scenario");

  if (btnOpen) {
    btnOpen.addEventListener("click", () => {
      afficherScoreboard(SCENARIOS_FICTIFS[indexScenarioActuel].joueurs);
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", masquerScoreboard);
  }

  if (btnScenario) {
    btnScenario.addEventListener("click", () => {
      indexScenarioActuel = (indexScenarioActuel + 1) % SCENARIOS_FICTIFS.length;
      btnScenario.textContent = `🔄 Changer de scénario fictif (${indexScenarioActuel + 1}/${SCENARIOS_FICTIFS.length})`;
      afficherScoreboard(SCENARIOS_FICTIFS[indexScenarioActuel].joueurs);
    });
  }

  // Affiche le scoreboard fictif au chargement pour visualiser directement le résultat
  afficherScoreboard(SCENARIOS_FICTIFS[0].joueurs);
});

// Expose les fonctions globalement pour que game.js ou socket.js puissent les appeler en fin de partie
window.afficherScoreboard = afficherScoreboard;
window.masquerScoreboard = masquerScoreboard;
