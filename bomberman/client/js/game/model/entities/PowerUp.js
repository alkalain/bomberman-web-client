export class PowerUp {
  constructor(col, row, type) {
    this.col = col;
    this.row = row;
    this.type = type;
  }

  // tileSize est passé en paramètre, car PowerUp n'a plus accès aux variables globales
  draw(ctx, tileSize, img) {
    const x = this.col * tileSize;
    const y = this.row * tileSize;

    if (img && img.complete && img.naturalWidth > 0) {
      const flottement = Math.sin(performance.now() / 250) * 3;
      ctx.drawImage(
        img,
        x + 8,
        y + 8 + flottement,
        tileSize - 16,
        tileSize - 16,
      );
    } else {
      // image absente : rond vert de secours
      ctx.beginPath();
      ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
      ctx.fillStyle = "#2ecc71";
      ctx.fill();
    }
  }
}
//export const CHANCE_DROP = 0.35;   // 35 % de chance par bloc détruit
export const CHANCE_DROP = 1; // 1 % de chance juste pour les tests
