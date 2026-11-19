# DevFlow · 前端

Vue 3 + TypeScript + Vite 前端应用。产品介绍、架构和完整启动方式见仓库根目录 [README](../README.md)。

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
```

Vite 会把 `/api` 代理到 `http://localhost:3001`，需要同时启动 `server/`。

## 脚本

```bash
npm run build       # vue-tsc -b && vite build
npm run analyze     # 构建并生成 dist/stats.html
npm run typecheck   # vue-tsc -b
npm run lint        # eslint .
npm run format      # prettier --write .
```
