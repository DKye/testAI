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
      case ' ': // Space
        this._hardDrop = true;
        this._start = true;
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
