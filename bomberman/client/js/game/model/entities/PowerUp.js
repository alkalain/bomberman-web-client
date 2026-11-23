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