import { CONFIG } from './game.js'

export class Renderer {
  constructor(canvas, previewCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.previewCanvas = previewCanvas;
    this.pctx = previewCanvas.getContext('2d');

    this.pixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.pixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(100, rect.width) * this.pixelRatio;
    const height = Math.max(100, rect.height) * this.pixelRatio;
    this.canvas.width = Math.floor(width);
    this.canvas.height = Math.floor(height);

    const prect = this.previewCanvas.getBoundingClientRect();
    const pwidth = Math.max(80, prect.width) * this.pixelRatio;
    const pheight = Math.max(80, prect.height) * this.pixelRatio;
    this.previewCanvas.width = Math.floor(pwidth);
    this.previewCanvas.height = Math.floor(pheight);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(tile, cols, rows, offsetY) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;

    const originX = Math.floor((canvas.width - cols * tile) / 2);
    const originY = Math.floor((canvas.height - rows * tile) / 2);

    for (let x = 0; x <= cols; x++) {
      const xx = originX + x * tile + 0.5;
      ctx.beginPath();
      ctx.moveTo(xx, originY);
      ctx.lineTo(xx, originY + rows * tile);
      ctx.stroke();
    }

    for (let y = 0; y <= rows; y++) {
      const yy = originY + y * tile + 0.5;
      ctx.beginPath();
      ctx.moveTo(originX, yy);
      ctx.lineTo(originX + cols * tile, yy);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawCell(x, y, tile, color, originX, originY) {
    const { ctx } = this;
    const px = originX + x * tile;
    const py = originY + y * tile;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, tile, tile);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(px, py, tile, Math.max(1, tile * 0.18));
  }

  draw(game) {
    const cols = CONFIG.COLS;
    const rows = CONFIG.VISIBLE_ROWS;

    this.clear();

    const tile = Math.floor(
      Math.min(this.canvas.width / cols, this.canvas.height / rows)
    );

    const originX = Math.floor((this.canvas.width - cols * tile) / 2);
    const originY = Math.floor((this.canvas.height - rows * tile) / 2);

    this.ctx.fillStyle = '#0f1420';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid(tile, cols, rows);

    for (let y = CONFIG.HIDDEN_ROWS; y < CONFIG.ROWS; y++) {
      const row = game.board[y];
      for (let x = 0; x < cols; x++) {
        const cell = row[x];
        if (cell) {
          const color = CONFIG.COLORS[cell];
          this.drawCell(x, y - CONFIG.HIDDEN_ROWS, tile, color, originX, originY);
        }
      }
    }

    if (game.current && game.state !== 'over') {
      const { x, y, shape, type } = game.current;
      const color = CONFIG.COLORS[type];

      // ghost
      let gy = y;
      while (!game.collides(game.current, 0, gy - y + 1)) {
        gy += 1;
      }
      for (let yy = 0; yy < shape.length; yy++) {
        for (let xx = 0; xx < shape[yy].length; xx++) {
          if (!shape[yy][xx]) continue;
          const gx = x + xx;
          const gyv = gy + yy - CONFIG.HIDDEN_ROWS;
          if (gyv >= 0) {
            this.ctx.globalAlpha = 0.2;
            this.drawCell(gx, gyv, tile, color, originX, originY);
            this.ctx.globalAlpha = 1;
          }
        }
      }

      // piece
      for (let yy = 0; yy < shape.length; yy++) {
        for (let xx = 0; xx < shape[yy].length; xx++) {
          if (!shape[yy][xx]) continue;
          const px = x + xx;
          const py = y + yy - CONFIG.HIDDEN_ROWS;
          if (py >= 0) this.drawCell(px, py, tile, color, originX, originY);
        }
      }
    }

    if (game.state !== 'running') {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0,0,0,0.45)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    this.drawPreview(game);
  }

  drawPreview(game) {
    const ctx = this.pctx;
    const w = this.previewCanvas.width;
    const h = this.previewCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f1420';
    ctx.fillRect(0, 0, w, h);

    const type = game.nextType;
    if (!type) return;

    const baseShapes = {
      I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
    };

    const shape = baseShapes[type];
    const color = CONFIG.COLORS[type];
    const size = shape.length;
    const tile = Math.floor(Math.min(w, h) / (size + 1));
    const offsetX = Math.floor((w - size * tile) / 2);
    const offsetY = Math.floor((h - size * tile) / 2);

    for (let yy = 0; yy < size; yy++) {
      for (let xx = 0; xx < size; xx++) {
        if (!shape[yy][xx]) continue;
        ctx.fillStyle = color;
        const px = offsetX + xx * tile;
        const py = offsetY + yy * tile;
        ctx.fillRect(px, py, tile, tile);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(px, py, tile, Math.max(1, tile * 0.18));
      }
    }
  }
}
