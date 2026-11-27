import { BOMB_DUREE_EXPLOSION } from "../model/entities/Bomb.js";
const TAILLE_SELECTION = 96; // taille d'affichage dans l'écran de choix (à adapter)
export class GameView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    if (!this.ctx) {
      throw new Error("Could not get the canvas 2D context");
    }

    this.ctx.imageSmoothingEnabled = false;
    this.horlogeSelection = 0;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawSelection({ couleurs, choix, apercus }) {
    const { ctx, canvas } = this;

    const ESPACE = 150;
    const DEBUT_X = canvas.width / 2 - (ESPACE * (couleurs.length - 1)) / 2;
    const centreY = 250;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.horlogeSelection++;

    ctx.fillStyle = "#222";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Choisis ton personnage", canvas.width / 2, 80);

    couleurs.forEach((couleur, index) => {
      const centreX = DEBUT_X + index * ESPACE;
      const selectionne = index === choix;

      // Le perso sélectionné s'anime (alterne 2 images), les autres restent fixes
      const frame = selectionne
        ? Math.floor(this.horlogeSelection / 30) % apercus[couleur].length
        : 0;
      const img = apercus[couleur][frame];

      const taille = selectionne ? TAILLE_SELECTION * 1.3 : TAILLE_SELECTION;

      // Cadre autour du perso sélectionné
      if (selectionne) {
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 4;
        ctx.strokeRect(centreX - 80, centreY - 100, 160, 200);
      }

      if (img.complete && img.naturalWidth > 0) {
        ctx.globalAlpha = selectionne ? 1 : 0.6;
        ctx.drawImage(
          img,
          centreX - taille / 2,
          centreY - taille / 2,
          taille,
          taille,
        );
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#222";
      ctx.font = selectionne ? "bold 20px sans-serif" : "18px sans-serif";
      ctx.fillText(couleur, centreX, centreY + 130);
    });

    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#555";
    ctx.fillText(
      "← →  pour choisir      Entrée  pour valider",
      canvas.width / 2,
      440,
    );
  }

  drawPersonnage(perso, sprites) {
    if (!perso.vivant) return;

    const img = sprites[perso.couleur]?.[perso.direction]?.[perso.frame];
    if (img?.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, perso.col, perso.row);
    }
  }

  // Dessin des bombes et flammes
  drawBombes(bombes, bombSprites, gameMap) {
    const now = performance.now();

    for (const bomb of bombes) {
      if (bomb.etat === "explosion") {
        const progression = Math.min(
          1,
          (now - bomb.debutExplosion) / BOMB_DUREE_EXPLOSION,
        );

        this.ctx.save();
        this.ctx.globalAlpha = 1 - progression * 0.6;

        for (const c of bomb.cases) {
          const x = c.col * gameMap.tileSize;
          const y = c.row * gameMap.tileSize;

          this.ctx.fillStyle = "orange";
          this.ctx.fillRect(
            x + 4,
            y + 4,
            gameMap.tileSize - 8,
            gameMap.tileSize - 8,
          );
          this.ctx.fillStyle = "yellow";
          this.ctx.fillRect(
            x + 14,
            y + 14,
            gameMap.tileSize - 28,
            gameMap.tileSize - 28,
          );
        }

        this.ctx.restore();
        continue;
      }

      const img =
        bomb.etat === "allumee" ? bombSprites.allumee : bombSprites.normale;

      if (img.complete && img.naturalWidth > 0) {
        this.ctx.drawImage(
          img,
          bomb.col * gameMap.tileSize,
          bomb.row * gameMap.tileSize,
          gameMap.tileSize,
          gameMap.tileSize,
        );
      }
    }
  }

  // --- crée la méthode projectile ------

  drawProjectiles(projectiles) {
    for (const p of projectiles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = "#9b59b6";
      this.ctx.fill();
    }
  }

  // ---------- HUD ----------
  drawHUD(perso) {
    this.ctx.fillStyle = "white";
    this.ctx.font = "18px sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Vies : ${perso.getVies()}   Bombes : ${perso.getBombesRestantes()}`,
      10,
      this.canvas.height - 10,
    );
    this.ctx.fillText(
      `Objet (E) : ${perso.objet ?? "aucun"}`,
      10,
      this.canvas.height - 34,
    );
  }

  // --------- DEATH ---------
  drawMort() {
    // Voile sombre sur toute la map
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#e63946";
    this.ctx.font = "bold 64px sans-serif";
    this.ctx.fillText(
      "TU ES MORT",
      this.canvas.width / 2,
      this.canvas.height / 2,
    );

    this.ctx.fillStyle = "white";
    this.ctx.font = "22px sans-serif";
    this.ctx.fillText(
      "Appuie sur Entrée pour rejouer",
      this.canvas.width / 2,
      this.canvas.height / 2 + 50,
    );
  }

  // ----------- MAP -----------
  drawMap(gameMap, mapAssets) {
    const { ctx } = this;
    const tileSize = gameMap.tileSize;

    for (let row = 0; row < gameMap.height; row++) {
      for (let col = 0; col < gameMap.width; col++) {
        const tile = gameMap.grid[row][col];
        const x = col * tileSize;
        const y = row * tileSize;
        const key = `${col},${row}`;

        // Every tile gets a floor image first.
        const floor = mapAssets.sols[gameMap.floorVariants[row][col]];
        if (floor?.complete && floor.naturalWidth > 0) {
          ctx.drawImage(floor, x, y, tileSize, tileSize);
        }

        // Spawn marker, if this coordinate is a spawn tile.
        const spawnColor = gameMap.spawnByTile.get(key);
        const spawnImage = spawnColor && mapAssets.spawn[spawnColor];
        if (spawnImage?.complete && spawnImage.naturalWidth > 0) {
          ctx.drawImage(spawnImage, x, y, tileSize, tileSize);
        }

        // Debris remains visible after a breakable block is destroyed.
        const debrisVariant = gameMap.destroyedBlocks.get(key);
        if (tile === 0 && debrisVariant !== undefined) {
          const debris = mapAssets.decombres[debrisVariant];
          if (debris?.complete && debris.naturalWidth > 0) {
            ctx.drawImage(debris, x, y, tileSize, tileSize);
          }
        }

        if (tile === 1) {
          const isBorder =
            col === 0 ||
            row === 0 ||
            col === gameMap.width - 1 ||
            row === gameMap.height - 1;

          ctx.fillStyle = "#6b4226";
          ctx.fillRect(x, y, tileSize, tileSize);

          const wall = isBorder ? mapAssets.bordure : mapAssets.mur;
          if (wall?.complete && wall.naturalWidth > 0) {
            ctx.drawImage(wall, x, y, tileSize, tileSize);
          }
        } else if (tile === 2) {
          const block = mapAssets.bloc;
          if (block?.complete && block.naturalWidth > 0) {
            ctx.drawImage(block, x, y, tileSize, tileSize);
          }
        }

        ctx.strokeStyle = "#333";
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  // Dessine un personnage vivant + l'anneau violet s'il est ralenti
  drawPersonnageComplet(p, sprites, tileSize) {
    if (!p.getVivant()) return; // un mort n'est plus dessiné

    this.drawPersonnage(p, sprites);

    if (p.effetActif("lent")) {
      this.ctx.beginPath();
      this.ctx.arc(
        p.col + tileSize / 2,
        p.row + tileSize / 2,
        28,
        0,
        Math.PI * 2,
      );
      this.ctx.strokeStyle = "#9b59b6";
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }
  }

  drawJeu({
    perso,
    ennemis, // --> A SUPPRIMER APRES LES TESTS
    bombes,
    items,
    gameMap,
    mapAssets,
    sprites,
    bombSprites,
    itemSprites,
    projectiles,
  }) {
    this.clear();
    this.drawMap(gameMap, mapAssets);
    for (const it of items)
      it.draw(this.ctx, gameMap.tileSize, itemSprites[it.type]);
    this.drawBombes(bombes, bombSprites, gameMap); // bombes et flammes sous le perso
    this.drawProjectiles(projectiles);

    this.drawPersonnageComplet(perso, sprites, gameMap.tileSize);
    for (const e of ennemis)
      this.drawPersonnageComplet(e, sprites, gameMap.tileSize);

    this.drawHUD(perso);
    if (!perso.getVivant()) this.drawMort();
  }
}
