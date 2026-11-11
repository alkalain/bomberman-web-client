export class Perso {
    constructor({
    col = 100,
    raw = 100,
    vitesse = 3,
    couleur = "bleu",
    direction = "bas",
    vies = 3,
    bombesRestantes = 10
    } = {}){

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
        
        this.dernierDepot = -Infinity;
        this.vivant = true;
    }
// -------- Getter/Setter ---------
    setCouleur(couleur) {
        this.couleur = couleur;
    }

    setSpawn(col, row) {
        this.col = col
        this.row = row;
        this.direction = "bas";

        this.frame = 0;
        this.compteur = 0;
        this.vivant = true;
    }

    setDirection(direction){
      this.direction = direction
    }

    setFrame(frame){
      this.frame = frame;
    }

    setCompter(compteur){
      this.compteur = compteur
    }

    setEtat(etat){
      this.etat = etat;
    }

    getVivant(){
      return this.vivant;
    }

    setVies(nbVies){
      this.vies + nbVies;
    }

    getVies(){
      return this.vies;
    }

    setBombesRestantes(bombRest){
      this.bombesRestantes=bombRest;
    }

    getBombesRestantes(){
      return this.bombesRestantes;
    }

// -----------------------

    caseDuPerso() {
        return {
            col: Math.floor((this.col + 20) / TILE_SIZE),
            row: Math.floor((this.row + 20) / TILE_SIZE),
        };
    }

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

  poserBombe() {
    if (!this.vivant) return false;

    const now = performance.now();
    if (this.bombesRestantes <= 0) return false;
    if (now - this.dernierDepot < COOLDOWN_BOMBE) return false;

    const { col, row } = this.caseDuPerso();

    if (bombes.some((b) => b.col === col && b.row === row)) return false;

    bombes.push(new Bomb(col, row, now, this));
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

  update(keys) {
    if (!this.vivant) return;

    let dx = 0;
    let dy = 0;
    let dir = null;

    if (keys.ArrowRight) {
      dx = this.vitesse;
      dir = "droite";
    } else if (keys.ArrowLeft) {
      dx = -this.vitesse;
      dir = "gauche";
    } else if (keys.ArrowUp) {
      dy = -this.vitesse;
      dir = "haut";
    } else if (keys.ArrowDown) {
      dy = this.vitesse;
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

  draw(ctx) {
    if (!this.vivant) return;

    const img = sprites[this.couleur][this.direction][this.frame];
    ctx.drawImage(img, this.col, this.row);
  }
}