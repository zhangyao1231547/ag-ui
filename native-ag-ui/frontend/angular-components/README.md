# AG-UI Angular 组件集成

这个目录包含了AG-UI协议的Angular组件实现，已集成到native-ag-ui项目中。

## 组件概述

本实现包含以下核心组件：

1. **CardComponent** - 单个卡片的渲染组件，支持不同状态和类型的卡片展示
2. **CardRendererComponent** - 卡片渲染器，负责管理多个卡片、处理AG-UI协议事件和模拟任务流程
3. **CardComponentsModule** - Angular模块，用于在应用中注册和使用卡片组件

## 功能特点

- 完整支持AG-UI协议事件处理
- 响应式卡片状态管理
- 美观的UI设计，包括玻璃态效果和渐变背景
- 内置模拟功能，可以测试不同的任务流程和状态更新
- 实时事件日志记录
- WebSocket连接管理

## 与native-ag-ui的集成

这些Angular组件与native-ag-ui项目完全兼容：

- 使用相同的AG-UI协议实现
- 连接到相同的WebSocket服务器（backend/server.py）
- 共享相同的事件处理逻辑
- 可以与原生前端实现并行运行

## 快速开始

### 1. 安装依赖

```bash
cd frontend/angular-components
npm install
```

### 2. 启动开发服务器

```bash
# 首先启动后端服务器
cd ../../backend
python server.py

# 然后启动Angular开发服务器
cd ../frontend/angular-components
npm start
```

### 3. 访问应用

打开浏览器访问 `http://localhost:4200`

## 文件结构

```
angular-components/
├── README.md                    # 本文件
├── package.json                 # 项目依赖
├── angular.json                 # Angular CLI配置
├── tsconfig.json               # TypeScript配置
├── src/
│   ├── index.html              # HTML入口
│   ├── main.ts                 # 应用启动
│   ├── styles.css              # 全局样式
│   ├── app.component.ts        # 主应用组件
│   ├── app.module.ts           # 应用模块
│   ├── card.component.ts       # 卡片组件
│   ├── card-renderer.component.ts  # 卡片渲染器
│   └── card-components.module.ts    # 卡片模块
```

## 与原生实现的对比

| 特性 | 原生实现 | Angular实现 |
|------|----------|-------------|
| 技术栈 | HTML/CSS/JS | Angular + TypeScript |
| 组件化 | 手动管理 | Angular组件系统 |
| 状态管理 | 原生JS | Angular响应式 |
| 类型安全 | 无 | TypeScript |
| 开发体验 | 基础 | 现代化工具链 |
| 构建优化 | 无 | Webpack + 优化 |

## 开发指南

### 添加新的卡片类型

1. 在 `card.component.ts` 中扩展 `CardType` 枚举
2. 更新卡片模板以支持新类型
3. 在 `card-renderer.component.ts` 中添加相应的事件处理逻辑

### 自定义样式

- 全局样式：修改 `styles.css`
- 组件样式：修改各组件文件中的 `styles` 数组

### 扩展AG-UI协议

1. 更新事件类型枚举
2. 添加相应的事件处理函数
3. 更新卡片数据结构（如需要）

## 注意事项

- 确保后端服务器运行在 `localhost:8000`
- Angular开发服务器默认运行在 `localhost:4200`
- 两个前端实现可以同时运行，连接到同一个后端
- 建议使用Chrome或Firefox浏览器以获得最佳体验