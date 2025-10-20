# 俄罗斯方块（原生 JS + Vite）

一个使用原生 HTML/CSS/JS 构建、基于 Canvas 渲染，并通过 Vite 开发/构建的可玩版俄罗斯方块。

## 功能特性
- 键盘操作：← → 左右移动，↑ 旋转，↓ 快速下落，Space 硬降，P 暂停/继续，R 重开，Enter/空格 开始
- 10×20 棋盘，7 种标准方块（I O T S Z J L）
- 消行计分与关卡提升（每消除 10 行提升 1 级）
- 快速/硬降加分（每个格子：快速下落 +1，硬降 +2）
- 下一块预览
- 最高分记录（localStorage 持久化）
- 响应式画布缩放与细腻网格

## 安装与本地运行

前置要求：Node.js 18+

```bash
npm install
npm run dev
```

启动后在终端中查看 Vite 输出的本地地址，浏览器打开即可。

## 构建与本地预览

```bash
npm run build
npm run preview
```

## 部署（GitHub Pages）

如果部署到 `https://<user>.github.io/<repo>/` 子路径，请在 `vite.config.js` 设置 `base` 为 `'/<repo>/'`，然后：

```bash
npm run build
# 将 dist/ 目录推送到 gh-pages 分支，或在仓库设置中配置 Pages 指向该目录
```

## 快捷键说明
- ← →：左右移动
- ↑：顺时针旋转
- ↓：快速下落（每下落 1 格加 1 分）
- Space：硬降（一次到底，每下落 1 格加 2 分）
- P：暂停/继续
- R：重开
- Enter/空格：开始游戏

## 常见问题（FAQ）
- 无法操作或按键无效？
  - 页面会自动将焦点聚焦到应用区域，也可点击画布或任意处以确保焦点在页面内。
- 为什么一切正常但突然暂停了？
  - 当浏览器窗口失焦（切换标签页或最小化）时会自动暂停，重新聚焦后按 P 继续。
- 如何清除最高分？
  - 清除浏览器 localStorage 中的 `tetris_best` 即可。
- 想调整游戏速度？
  - 可在 `src/game.js` 的 `getFallIntervalMs(level)` 中修改重力下落间隔算法。

## 可访问性（Accessibility）
- 主容器可聚焦并捕获键盘输入，同时提供可见的中文操作说明
- 统计信息（分数/行数/等级/最高分）在 ARIA live region 中动态更新

本项目旨在提供清晰、简洁且易于学习的示例代码，欢迎二次开发或教学使用。
