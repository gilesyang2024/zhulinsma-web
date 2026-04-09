# 🎋 竹林司马 Web (Zhulinsma Web)

> 竹林司马·前端可视化平台 | React + TypeScript + Vite + TailwindCSS + Lightweight Charts

## 技术栈

- **框架**: React 18 + TypeScript + Vite
- **样式**: TailwindCSS + Radix UI
- **图表**: Lightweight Charts (专业K线) + Recharts
- **状态**: Zustand
- **路由**: React Router v7
- **动画**: Framer Motion
- **实时**: WebSocket

## 快速启动

```bash
npm install
npm run dev
```

后端服务：确保 `backend_server.py` 已运行（Python Flask）

## 功能特性

- 📊 专业K线图（Lightweight Charts）
- 🔴🟢 红涨绿跌（广州模式）
- ⚡ 实时数据推送（WebSocket）
- 🔔 技术指标预警系统（RSI/MA金叉）
- 🌓 深色/浅色主题切换
- 📱 响应式布局

## 项目结构

```
src/
├── components/
│   ├── charts/     # K线图、迷你图
│   ├── stock/      # 股票卡片、详情、预警
│   └── ui/         # 通用UI组件
├── hooks/          # useRealtime, useTheme
├── pages/          # Dashboard, AnalysisReport
├── store/          # Zustand状态管理
├── lib/            # API客户端
└── types/          # TypeScript类型定义
```

## 后端仓库

👉 [竹林司马主工程](https://github.com/gilesyang2024/zhulinsma) - Python后端 + 技术分析引擎
