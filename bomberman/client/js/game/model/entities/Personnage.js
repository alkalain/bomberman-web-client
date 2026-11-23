export class Personnage {
  constructor({
    col = 100,
    row = 100,
    vitesse = 3,
    couleur = "bleu",
    direction = "bas",
    vies = 3,
    bombesRestantes = 10,

    gameMap,

    isBombAtPixel,
    getBombes,
    BombClass,
    cooldownBombe,
  } = {}) {
    this.col = col;
    this.row = row;

    this.vitesse = vitesse;
    this.couleur = couleur;

    this.direction = direction;
    this.frame = 0;
    this.compteur = 0;
    this.vitesseAnim = 10;

    this.vies = vies;
    this.bombesRestantes = bombesRestantes;
    this.effets = {}; // nom de l'effet -> heure de fin

    this.gameMap = gameMap;

    this.dernierDepot = -Infinity;
    this.vivant = true;

    this.isBombAtPixel = isBombAtPixel;
    this.getBombes = getBombes;
    this.BombClass = BombClass;
    this.cooldownBombe = cooldownBombe;
  }
  // -------- Getter/Setter ---------
  setCouleur(couleur) {
    this.couleur = couleur;
  }

  setSpawn(col, row) {
    this.col = col;
    this.row = row;
    this.direction = "bas";

    this.frame = 0;
    this.compteur = 0;
    this.vivant = true;
    this.effets = {}; //reset l'effet à chaque nouvelle partie. 
  }

  getVitesse() {
    return this.vitesse;
  }

  setDirection(direction) {
    this.direction = direction;
  }

  setFrame(frame) {
    this.frame = frame;
  }

  setCompteur(compteur) {
    this.compteur = compteur;
  }

  setEtat(etat) {
    this.etat = etat;
  }

  getVivant() {
    return this.vivant;
  }

  setVies(nbVies) {
    this.vies += nbVies;
  }

  getVies() {
    return this.vies;
  }

  setBombesRestantes(bombRest) {
    this.bombesRestantes = bombRest;
  }

  getBombesRestantes() {
    return this.bombesRestantes;
  }

  caseDuPerso() {
    return {
      col: Math.floor((this.col + 20) / this.gameMap.tileSize),
      row: Math.floor((this.row + 20) / this.gameMap.tileSize),
    };
  }

  // ---------- HITBOXES ---------
  hitbox() {
    return {
      left: this.col + 8,
      right: this.col + 8 + 24,
      top: this.row + 8,
      bottom: this.row + 8 + 24,
    };
  }

  canMoveTo(col, row) {
    const left = col + 8;
    const right = col + 8 + 24 - 1;
    const top = row + 8;
    const bottom = row + 8 + 24 - 1;

    return !(
      this.gameMap.isBlockedAtPixel(left, top) ||
      this.gameMap.isBlockedAtPixel(right, top) ||
      this.gameMap.isBlockedAtPixel(left, bottom) ||
      this.gameMap.isBlockedAtPixel(right, bottom) ||
      this.isBombAtPixel(left, top) ||
      this.isBombAtPixel(right, top) ||
      this.isBombAtPixel(left, bottom) ||
      this.isBombAtPixel(right, bottom)
    );
  }

  poserBombe() {
    const now = performance.now();
    const bombes = this.getBombes();

    if (!this.vivant) return false;

    if (this.bombesRestantes <= 0) return false;
    if (now - this.dernierDepot < this.cooldownBombe) return false;

    const { col, row } = this.caseDuPerso();

    if (bombes.some((b) => b.col === col && b.row === row)) return false;

    bombes.push(new this.BombClass(col, row, now, this.gameMap, this));
    this.bombesRestantes--;
    this.dernierDepot = now;

    return true;
  }

  prendreDegat() {
    if (!this.vivant) return;

    this.vies--;
    console.log("Touché ! Vies restantes :", this.vies);

    if (this.vies <= 0) {
      this.vies = 0;
      this.vivant = false;
    }
  }

  // -------------------  EFFETS POUR LES ITEAMS BONUS/MALUS --------

  // Lance un effet pour "duree" millisecondes
  activerEffet(nom, duree) {
    this.effets[nom] = performance.now() + duree;
  }

  // L'effet est-il encore actif ?
  effetActif(nom) {
    return (this.effets[nom] ?? 0) > performance.now();
  }

  // Vitesse réelle : la vitesse de base, modifiée par les effets en cours
  vitesseActuelle() {
    let v = this.vitesse;
    if (this.effetActif("rapide")) v *= 1.8;
    return v;
  }

  // ----------- MàJ de postion du personage selon commande ----------
  update(keys) {
    if (!this.vivant) return;
    const v = this.vitesseActuelle(); // va être repris pour mettre à jour la vitesse pour le bonus

    let dx = 0;
    let dy = 0;
    let dir = null;

    if (keys.ArrowRight) {
      dx = v; // on va mettre v à de this.vitesse pour l'update dans le bonus
      dir = "droite";
    } else if (keys.ArrowLeft) {
      dx = -v;
      dir = "gauche";
    } else if (keys.ArrowUp) {
      dy = -v;
      dir = "haut";
    } else if (keys.ArrowDown) {
      dy = v;
      dir = "bas";
    }

    const oldX = this.col;
    const oldY = this.row;

    if (dx !== 0 && this.canMoveTo(this.col + dx, this.row)) {
      this.col += dx;
    }
    if (dy !== 0 && this.canMoveTo(this.col, this.row + dy)) {
      this.row += dy;
    }

    const moved = this.col !== oldX || this.row !== oldY;

    if (dir) {
      if (dir !== this.direction) {
        this.direction = dir;
        this.frame = 0;
        this.compteur = 0;
      }

      if (moved) {
        this.compteur++;
        if (this.compteur >= this.vitesseAnim) {
          this.compteur = 0;
          this.frame = (this.frame + 1) % 2;
        }
      } else {
        this.frame = 0;
        this.compteur = 0;
      }
    } else {
      this.frame = 0;
      this.compteur = 0;
    }
  }
}
