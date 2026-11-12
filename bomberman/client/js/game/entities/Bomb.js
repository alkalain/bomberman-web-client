import {
  TILE_SIZE,
  map,
  blocsDetruits,
  imgsDecombres,
} from "../map.js";

const BOMB_DELAI_ALLUMAGE = 1000;   // s'allume après 1 s
const BOMB_DELAI_EXPLOSION = 2000;  // explose après 2 s
const BOMB_DUREE_EXPLOSION = 500;   // flammes visibles 0,5 s
const BOMB_PORTEE = 2;              // 2 cases par direction

const imgBombe = new Image();
imgBombe.src = "img/bombe.png";
const imgBombeAllumee = new Image();
imgBombeAllumee.src = "img/bombe_allumee.png";

export class Bomb {
  constructor(col, row, now, owner = null) {
    this.col = col;
    this.row = row;
    this.owner = owner;       // à qui elle appartient 
    this.pose = now;          // heure de pose
    this.etat = "normale";    // "normale" -> "allumee" -> "explosion"
    this.cases = [];          // cases touchées (remplies à l'explosion)
    this.debutExplosion = 0;
    this.solide = false;   // pas solide au début : le joueur est dessus et doit pouvoir sortir
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
        const type = map[r]?.[c];

        if (type === undefined || type === 1) break;  // hors map ou mur
        cases.push({ col: c, row: r });
        if (type === 2) {                             // bloc cassable
          map[r][c] = 0;
            blocsDetruits.set(`${c},${r}`, Math.floor(Math.random() * imgsDecombres.length)); // marque la case comme détruite pour l'affichage
          break;
        }
      }
    }
    return cases;
  }

  draw(ctx, now) {
    if (this.etat === "explosion") {
      const progression = (now - this.debutExplosion) / BOMB_DUREE_EXPLOSION;
      ctx.globalAlpha = 1 - progression * 0.6;
      for (const c of this.cases) {
        const x = c.col * TILE_SIZE;
        const y = c.row * TILE_SIZE;
        ctx.fillStyle = "orange";
        ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = "yellow";
        ctx.fillRect(x + 14, y + 14, TILE_SIZE - 28, TILE_SIZE - 28);
      }
      ctx.globalAlpha = 1;
    } else {
       const img = this.etat === "allumee" ? imgBombeAllumee : imgBombe;

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(
          img,
          this.col * TILE_SIZE,
          this.row * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        );
      }
    }
  }
}