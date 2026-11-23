export const BOMB_DELAI_ALLUMAGE = 1000;   // s'allume après 1 s
export const BOMB_DELAI_EXPLOSION = 2000;  // explose après 2 s
export const BOMB_DUREE_EXPLOSION = 500;   // flammes visibles 0,5 s
export const BOMB_PORTEE = 2;              // 2 cases par direction

export class Bomb {
  constructor(col, row, now, gameMap,owner = null) {
    this.col = col;
    this.row = row;
    this.gameMap = gameMap;
    this.owner = owner;       // à qui elle appartient 
    this.pose = now;          // heure de pose
    this.etat = "normale";    // "normale" -> "allumee" -> "explosion"
    this.cases = [];          // cases touchées (remplies à l'explosion)
    this.debutExplosion = 0;
    this.solide = false;   // pas solide au début : le joueur est dessus et doit pouvoir sortir
    this.blocsDetruits = [];   // cases où un bloc a été détruit par cette explosion
  }

  // Appelée à chaque frame. Renvoie true UNIQUEMENT au moment où elle explose.
  update(now) {
    if (this.etat === "explosion") return false;

    const age = now - this.pose;

    if (age >= BOMB_DELAI_EXPLOSION) {
      this.etat = "explosion";
      this.solide = false;          
      this.debutExplosion = now;
      this.cases = this.calculerExplosion();
      return true;
    }
    if (age >= BOMB_DELAI_ALLUMAGE) {
      this.etat = "allumee";
    }
    return false;
  }

  // Vrai quand les flammes sont finies : le jeu peut la supprimer
  estTerminee(now) {
    return this.etat === "explosion" && now - this.debutExplosion >= BOMB_DUREE_EXPLOSION;
  }

  // Cases touchées : centre + 2 cases dans chaque direction
  calculerExplosion() {
    const cases = [{ col: this.col, row: this.row }];

    for (const [dc, dr] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
      for (let i = 1; i <= BOMB_PORTEE; i++) {
        const c = this.col + dc * i;
        const r = this.row + dr * i;
        const type = this.gameMap.getTileAt(c,r);

        if (type === undefined || type === 1) break;  // hors map ou mur
        cases.push({ col: c, row: r });
        if (type === 2) {                             // bloc cassable
          this.gameMap.destroyBlockAt(c,r) // marque la case comme détruite pour l'affichage
          this.blocsDetruits.push({ col: c, row: r });   // gere l'apparition d'item lorsqu'un bloc est détruit
          break;
        }
      }
    }
    return cases;
  }
}