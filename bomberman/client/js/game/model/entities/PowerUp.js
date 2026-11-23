export class PowerUp {
  constructor(col, row, type) {
    this.col = col;
    this.row = row;
    this.type = type;
  }

  // tileSize est passé en paramètre, car PowerUp n'a plus accès aux variables globales
  draw(ctx, tileSize) {
    const x = this.col * tileSize;
    const y = this.row * tileSize;

    ctx.beginPath();
    ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
    ctx.fillStyle = "#2ecc71";
    ctx.fill();
  }
}

//export const CHANCE_DROP = 0.35;   // 35 % de chance par bloc détruit
export const CHANCE_DROP = 1;   // 1 % de chance juste pour les tests

// Types d'items existants.
export const TYPES_ITEMS = ["speed_boost"];

// Renvoie un nom de type au hasard
export function tirerType() {
  return TYPES_ITEMS[Math.floor(Math.random() * TYPES_ITEMS.length)];
}