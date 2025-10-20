import { Game } from './game.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'

const appEl = document.getElementById('app')
const gameCanvas = document.getElementById('game-canvas')
const nextCanvas = document.getElementById('next-canvas')
const scoreEl = document.getElementById('score')
const linesEl = document.getElementById('lines')
const levelEl = document.getElementById('level')
const bestEl = document.getElementById('best')
const overlayEl = document.getElementById('overlay')

const game = new Game()
const renderer = new Renderer(gameCanvas, nextCanvas)
const input = new Input(appEl)

function focusApp() {
  if (appEl && typeof appEl.focus === 'function') appEl.focus()
}

focusApp()

let lastTime = performance.now()

function updateOverlay() {
  let text = ''
  if (game.state === 'ready') {
    text = 'Press Space to Start'
  } else if (game.state === 'paused') {
    text = 'Paused — Press P to Resume'
  } else if (game.state === 'over') {
    text = 'Game Over — Press R to Restart'
  }
  overlayEl.textContent = text
  overlayEl.style.display = game.state === 'running' ? 'none' : 'grid'
}

function loop(now) {
  const dt = now - lastTime
  lastTime = now

  const req = input.consume()

  if (game.state === 'ready' && req.start) {
    game.start()
    // prevent space from triggering immediate hard drop on first frame
    req.hardDrop = false
  }

  if (req.pauseToggle) game.pauseToggle()
  if (req.restart) {
    game.reset()
    game.state = 'running'
  }

  game.update(dt, req)

  scoreEl.textContent = String(game.score)
  linesEl.textContent = String(game.lines)
  levelEl.textContent = String(game.level)
  bestEl.textContent = String(game.best)
  updateOverlay()

  renderer.draw(game)

  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)

window.addEventListener('blur', () => {
  if (game.state === 'running') game.pauseToggle()
})

window.addEventListener('click', focusApp)
