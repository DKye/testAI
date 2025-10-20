// 输入采集器：监听键盘事件，将用户输入转换为一帧内可消费的请求对象
// 说明：
// - 像移动/旋转/硬降/开始/暂停/重开这类按键是瞬时触发，读取后会被清空
// - 快速下落（ArrowDown）在按住期间保持为激活状态（softDropActive）

export class Input {
  constructor(targetEl) {
    this.target = targetEl || window;

    this._moveLeft = false;
    this._moveRight = false;
    this._rotateCW = false;
    this._hardDrop = false;
    this._pauseToggle = false;
    this._restart = false;
    this._start = false;
    this.softDropActive = false;

    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);

    // 使用 passive: false 以便阻止方向键/空格触发页面滚动等默认行为
    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp, { passive: false });
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  onKeyDown(e) {
    const key = e.key;
    if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(key)) {
      e.preventDefault();
    }
    switch (key) {
      case 'ArrowLeft':
        this._moveLeft = true;
        break;
      case 'ArrowRight':
        this._moveRight = true;
        break;
      case 'ArrowUp':
        this._rotateCW = true;
        break;
      case 'ArrowDown':
        this.softDropActive = true;
        break;
      case ' ': // 空格（Space）
        this._hardDrop = true;
        this._start = true; // 空格也可用于开始游戏
        break;
      case 'p':
      case 'P':
        this._pauseToggle = true;
        break;
      case 'r':
      case 'R':
        this._restart = true;
        break;
      case 'Enter':
        this._start = true;
        break;
      default:
        break;
    }
  }

  onKeyUp(e) {
    switch (e.key) {
      case 'ArrowDown':
        this.softDropActive = false;
        break;
      default:
        break;
    }
  }

  // 将当前帧累积到的输入请求打包返回，同时重置瞬时输入标志
  consume() {
    const req = {
      moveLeft: this._moveLeft,
      moveRight: this._moveRight,
      rotateCW: this._rotateCW,
      hardDrop: this._hardDrop,
      pauseToggle: this._pauseToggle,
      restart: this._restart,
      start: this._start,
      softDropActive: this.softDropActive,
    };
    this._moveLeft = false;
    this._moveRight = false;
    this._rotateCW = false;
    this._hardDrop = false;
    this._pauseToggle = false;
    this._restart = false;
    this._start = false;
    return req;
  }
}
