// 入口模块：绑定 DOM、创建游戏/渲染/输入实例，并驱动主循环
// - 界面上所有可见文案在此汇总（覆盖层提示等）以便本地化
// - 通过 requestAnimationFrame 形成游戏主循环

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

// 核心对象：游戏状态机 + 渲染器 + 输入采集器
const game = new Game()
const renderer = new Renderer(gameCanvas, nextCanvas)
const input = new Input(appEl)

function focusApp() {
  // 使主容器可聚焦，便于捕获方向键等输入
  if (appEl && typeof appEl.focus === 'function') appEl.focus()
}

focusApp()

let lastTime = performance.now()

// 更新覆盖层文案（就绪/暂停/结束）
function updateOverlay() {
  let text = ''
  if (game.state === 'ready') {
    text = '按 空格 或 回车 开始'
  } else if (game.state === 'paused') {
    text = '已暂停 — 按 P 继续'
  } else if (game.state === 'over') {
    text = '游戏结束 — 按 R 重开'
  }
  overlayEl.textContent = text
  overlayEl.style.display = game.state === 'running' ? 'none' : 'grid'
}

// 主循环：
// - 计算与上一帧的时间差 dt
// - 读取并消费输入（瞬时按键在消费后即清空）
// - 根据输入控制游戏（开始/暂停/重开/移动/旋转/下落）
// - 刷新统计信息与覆盖层文案
// - 调用渲染器绘制画面
function loop(now) {
  const dt = now - lastTime
  lastTime = now

  const req = input.consume()

  if (game.state === 'ready' && req.start) {
    game.start()
    // 防止在第一帧按下空格导致立即硬降
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

// 失焦自动暂停，避免误操作或错过下落
window.addEventListener('blur', () => {
  if (game.state === 'running') game.pauseToggle()
})

// 任意点击尝试聚焦到应用，方便键盘操作
window.addEventListener('click', focusApp)
