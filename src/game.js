const COLS = 10;
const VISIBLE_ROWS = 20;
const HIDDEN_ROWS = 2;
const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

const SCORE_PER_LINE = [0, 100, 300, 500, 800];

const COLORS = {
  I: '#34d399',
  O: '#fbbf24',
  T: '#a78bfa',
  S: '#22d3ee',
  Z: '#f87171',
  J: '#60a5fa',
  L: '#fb923c',
};

const SHAPES = {
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

function rotateMatrixCW(m) {
  const n = m.length;
  const res = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      res[x][n - 1 - y] = m[y][x];
    }
  }
  return res;
}

function deepClone(m) {
  return m.map((row) => row.slice());
}

function bag() {
  const types = Object.keys(SHAPES);
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function getFallIntervalMs(level) {
  const base = 1000; // level 1
  const step = 70; // decrease per level
  const min = 60;
  return Math.max(base - (level - 1) * step, min);
}

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = createBoard();
    this.level = 1;
    this.score = 0;
    this.lines = 0;
    this.best = Number(localStorage.getItem('tetris_best') || '0');

    this.queue = bag();
    this.nextType = this.queue.shift();
    this.current = null;

    this.state = 'ready'; // ready | running | paused | over

    this.gravityTimer = 0;
    this.fallInterval = getFallIntervalMs(this.level);

    this.spawnPiece();
  }

  start() {
    if (this.state === 'ready' || this.state === 'over') {
      this.state = 'running';
      this.gravityTimer = 0;
    } else if (this.state === 'paused') {
      this.state = 'running';
    }
  }

  pauseToggle() {
    if (this.state === 'running') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'running';
    }
  }

  spawnPiece() {
    if (this.queue.length < 7) {
      this.queue.push(...bag());
    }
    const type = this.nextType || this.queue.shift();
    this.nextType = this.queue.shift();
    const shape = SHAPES[type];
    const size = shape.length;
    const x = Math.floor(COLS / 2) - Math.ceil(size / 2);
    const y = 0;
    this.current = { type, x, y, rotation: 0, shape: deepClone(shape) };
    if (this.collides(this.current, 0, 0, this.current.shape)) {
      this.state = 'over';
      this.updateBest();
    }
  }

  updateBest() {
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('tetris_best', String(this.best));
    }
  }

  hardDrop() {
    if (this.state !== 'running') return;
    let distance = 0;
    while (!this.collides(this.current, 0, 1)) {
      this.current.y += 1;
      distance += 1;
    }
    if (distance > 0) {
      this.score += distance * 2;
      this.updateBest();
    }
    this.lockPiece();
  }

  move(dx) {
    if (this.state !== 'running') return;
    if (!this.collides(this.current, dx, 0)) {
      this.current.x += dx;
    }
  }

  rotateCW() {
    if (this.state !== 'running') return;
    const rotated = rotateMatrixCW(this.current.shape);
    const kicks = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, -1],
      [2, 0],
      [-2, 0],
    ];
    for (const [kx, ky] of kicks) {
      if (!this.collides(this.current, kx, ky, rotated)) {
        this.current.shape = rotated;
        this.current.x += kx;
        this.current.y += ky;
        this.current.rotation = (this.current.rotation + 1) % 4;
        return;
      }
    }
  }

  stepDown(byInput = false) {
    if (!this.collides(this.current, 0, 1)) {
      this.current.y += 1;
      if (byInput) {
        this.score += 1;
        this.updateBest();
      }
      return true;
    } else {
      return false;
    }
  }

  lockPiece() {
    const { shape, x, y, type } = this.current;
    for (let yy = 0; yy < shape.length; yy++) {
      for (let xx = 0; xx < shape[yy].length; xx++) {
        if (shape[yy][xx]) {
          const by = y + yy;
          const bx = x + xx;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            this.board[by][bx] = type;
          }
        }
      }
    }
    const cleared = this.clearLines();
    if (cleared > 0) {
      this.score += SCORE_PER_LINE[cleared];
      this.lines += cleared;
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.fallInterval = getFallIntervalMs(this.level);
      }
      this.updateBest();
    }
    this.spawnPiece();
  }

  clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y].every((c) => c)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(COLS).fill(0));
        cleared += 1;
        y += 1;
      }
    }
    return cleared;
  }

  collides(piece, dx = 0, dy = 0, testShape = null) {
    const shape = testShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const nx = piece.x + x + dx;
        const ny = piece.y + y + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  update(dt, inputReq) {
    if (this.state === 'over') return;

    if (inputReq.restart) {
      this.reset();
      this.state = 'running';
      return;
    }

    if (inputReq.pauseToggle) {
      this.pauseToggle();
    }

    if (this.state === 'ready') {
      if (inputReq.start) {
        this.start();
      }
      return;
    }

    if (this.state !== 'running') return;

    if (inputReq.moveLeft) this.move(-1);
    if (inputReq.moveRight) this.move(1);
    if (inputReq.rotateCW) this.rotateCW();
    if (inputReq.hardDrop) this.hardDrop();

    if (inputReq.softDropActive) {
      // allow fast manual drop, score per step
      while (this.stepDown(true)) {
        if (this.collides(this.current, 0, 1)) break;
      }
    }

    this.gravityTimer += dt;
    if (this.gravityTimer >= this.fallInterval) {
      this.gravityTimer = 0;
      if (!this.stepDown(false)) {
        this.lockPiece();
      }
    }
  }
}

export const CONFIG = {
  COLS,
  ROWS,
  VISIBLE_ROWS,
  HIDDEN_ROWS,
  COLORS,
};
