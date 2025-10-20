// 游戏核心状态与规则实现
// 主要职责：
// - 维护棋盘（含隐藏行）、当前方块、下一方块队列（7-bag 随机）
// - 处理移动/旋转/下落/锁定/消行/计分/升级
// - 提供碰撞检测与重力下落节奏

const COLS = 10; // 棋盘列数
const VISIBLE_ROWS = 20; // 可见行数
const HIDDEN_ROWS = 2; // 顶部隐藏行，用于方块生成的缓冲区
const ROWS = VISIBLE_ROWS + HIDDEN_ROWS; // 实际棋盘总行数

// 消行计分（一次性消除 n 行对应的加分）
const SCORE_PER_LINE = [0, 100, 300, 500, 800];

// 每种方块的颜色（用于渲染）
const COLORS = {
  I: '#34d399',
  O: '#fbbf24',
  T: '#a78bfa',
  S: '#22d3ee',
  Z: '#f87171',
  J: '#60a5fa',
  L: '#fb923c',
};

// 方块形状定义：使用 0/1 的正方形矩阵表示
// 注意：所有形状尺寸相对紧凑，部分为 4x4 或 3x3/2x2
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

// 顺时针旋转 N×N 矩阵（用于方块旋转）
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

// 浅复制矩阵（用于生成方块副本，避免直接修改基准定义）
function deepClone(m) {
  return m.map((row) => row.slice());
}

// 7-bag 随机：一次打乱 7 种方块类型，依次取用，队列不足时再补充一袋
function bag() {
  const types = Object.keys(SHAPES);
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

// 创建初始棋盘（包含隐藏行）
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// 根据等级计算重力（自然下落）间隔，等级越高下落越快
function getFallIntervalMs(level) {
  const base = 1000; // 1 级基础为 1000ms
  const step = 70; // 每升 1 级减少 70ms
  const min = 60; // 最小间隔（封顶速度）
  return Math.max(base - (level - 1) * step, min);
}

export class Game {
  constructor() {
    this.reset();
  }

  // 重置所有状态，回到初始局面（保留本地最高分 best）
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

  // 开始/继续游戏
  start() {
    if (this.state === 'ready' || this.state === 'over') {
      this.state = 'running';
      this.gravityTimer = 0;
    } else if (this.state === 'paused') {
      this.state = 'running';
    }
  }

  // 暂停/继续切换
  pauseToggle() {
    if (this.state === 'running') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'running';
    }
  }

  // 生成新方块于顶端居中位置；若一开始就碰撞，判定游戏结束
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

  // 若当前分数超过历史最高分则更新本地存储
  updateBest() {
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('tetris_best', String(this.best));
    }
  }

  // 硬降：直接到底部，按距离给予 2 分/格
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

  // 水平移动（带碰撞检测）
  move(dx) {
    if (this.state !== 'running') return;
    if (!this.collides(this.current, dx, 0)) {
      this.current.x += dx;
    }
  }

  // 顺时针旋转，附带简化“踢墙”尝试以避免卡在墙边/堆叠上
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

  // 自然/手动下落一步；手动（快速下落）时每步 +1 分
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

  // 将当前方块锁定到棋盘，完成后检测消行、计分与升级，并生成下一方块
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

  // 从底向上检查满行，移除并在顶部补空行，返回清除的行数
  clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y].every((c) => c)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(COLS).fill(0));
        cleared += 1;
        y += 1; // 重新检查当前行位置（上移后回退索引）
      }
    }
    return cleared;
  }

  // 碰撞检测：
  // - 检查形状每个单元格变换后的坐标是否越界或与棋盘已有方块重叠
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

  // 每帧更新：处理输入与重力计时器；在运行态下推进游戏
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
      // 连续快速下落：允许在一帧内多步，按步加分
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
