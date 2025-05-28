# 原生AG-UI实现

这是一个使用原生技术栈实现的AG-UI前后端应用。现已集成阿里云通义千问大模型，提供智能对话功能。

## 技术栈

### 后端
- Python 3.9+ (原生HTTP服务器)
- 无外部框架依赖
- WebSocket支持实时通信
- AG-UI协议兼容

### 前端
- 原生HTML5 + CSS3 + JavaScript
- WebSocket客户端
- 响应式设计
- 暗色/亮色主题切换

## 功能特性

- 🚀 **原生实现**: 使用Python原生HTTP服务器和WebSocket，无需额外框架
- 🎯 **AG-UI协议**: 完整实现AG-UI协议规范，支持实时事件处理
- 💬 **智能对话**: 集成阿里巴巴通义千问大模型，提供智能对话能力
- 🌐 **实时通信**: WebSocket实现的双向实时通信
- 🎨 **现代UI**: 响应式设计，支持深色/浅色主题切换
- 📱 **移动适配**: 完美适配移动设备，提供流畅的移动端体验
- ⚡ **Angular组件**: 新增Angular卡片组件实现，提供现代化的组件化开发体验

## 快速开始

### 1. 配置通义千问API

首先需要配置阿里云通义千问API密钥：

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入您的DASHSCOPE_API_KEY
```

获取API密钥：
1. 访问 [阿里云百炼平台](https://help.aliyun.com/zh/model-studio/getting-started/models)
2. 注册并开通通义千问服务
3. 获取API密钥（格式：sk-xxx）

### 2. 安装依赖

```bash
cd backend
pip3 install -r requirements.txt
```

### 3. 启动后端服务

```bash
cd backend
python3 server.py
```

### 4. 访问前端

打开浏览器访问：http://localhost:8000

## 项目结构

```
native-ag-ui/
├── backend/
│   ├── server.py          # 主服务器
│   ├── ag_ui_protocol.py  # AG-UI协议实现
│   ├── websocket_handler.py # WebSocket处理
│   └── agent_simulator.py # 智能体模拟器
├── frontend/
│   ├── index.html         # 主页面
│   ├── style.css          # 样式文件
│   ├── script.js          # 主要逻辑
│   └── ag-ui-client.js    # AG-UI客户端
└── README.md
```

## AG-UI协议支持

支持以下AG-UI事件类型：
- TEXT_MESSAGE_START/CONTENT/END
- TOOL_CALL_START/ARGS/END
- STATE_SNAPSHOT/DELTA
- RUN_STARTED/FINISHED/ERROR
- CUSTOM事件


## 项目结构
创建了完整的AG-UI原生实现，包含以下核心文件：

### 后端实现 (Python)
- `ag_ui_protocol.py` - AG-UI协议核心实现
- `websocket_handler.py` - WebSocket通信处理
- `server.py` - HTTP和WebSocket服务器
- `agent_simulator.py` - AI代理模拟器
### 前端实现 (原生HTML/CSS/JavaScript)
- `index.html` - 主页面界面
- `style.css` - 现代化样式设计
- `ag-ui-client.js` - AG-UI协议客户端
- `script.js` - 前端主要逻辑
## 核心功能
### AG-UI协议支持
- ✅ 文本消息流式传输 ( TEXT_MESSAGE_START , TEXT_MESSAGE_CONTENT , TEXT_MESSAGE_END )
- ✅ 工具调用事件 ( TOOL_CALL_START , TOOL_CALL_END )
- ✅ 状态同步 ( STATE_SNAPSHOT , STATE_DELTA )
- ✅ 自定义事件处理
- ✅ 实时双向通信
### 前端特性
- 🎨 现代化响应式UI设计
- 🌓 明暗主题切换
- 💬 实时聊天界面
- 📊 事件日志面板
- 🔄 自动重连机制
- 📱 移动端适配
### 后端特性
- 🔌 WebSocket实时通信
- 🤖 智能代理模拟器
- 🛠️ 工具调用演示（天气查询、计算器、网络搜索）
- 📡 完整的AG-UI协议实现
- 🔄 状态管理和同步
## 服务运行状态
✅ 后端服务器 : 运行在 http://localhost:8000

- HTTP API服务
- WebSocket通信服务
- AG-UI协议处理
✅ 前端服务器 : 运行在 http://localhost:8080

- 静态文件服务
- 用户界面访问
## 使用说明

### 基础Web界面
1. 启动服务器后，打开浏览器访问 `http://localhost:8000`
2. 在聊天界面中输入消息
3. 系统会自动调用通义千问API生成智能回复
4. 支持多轮对话和上下文理解
5. 可以通过右上角按钮切换深色/浅色主题

### Angular组件集成

本项目现已集成Angular卡片组件实现，提供更现代化的组件化开发体验：

#### 快速启动Angular组件

```bash
# 进入Angular组件目录
cd frontend/angular-components

# 安装依赖
npm install

# 启动开发服务器（端口4201）
npm start
```

#### Angular组件特性

- 🎯 **完整AG-UI协议支持**: 与后端完全兼容的WebSocket通信
- 🎨 **现代化UI设计**: 采用glassmorphism设计风格
- ⚡ **实时状态管理**: 响应式数据绑定和状态同步
- 🔄 **动画效果**: 流畅的卡片动画和过渡效果
- 📊 **事件日志**: 实时显示AG-UI事件处理过程
- 🛠️ **模拟功能**: 内置任务流程和状态更新模拟

#### 组件架构

- `CardComponent`: 单个卡片组件，支持多种状态和类型
- `CardRendererComponent`: 卡片渲染器，处理WebSocket连接和事件
- `CardComponentsModule`: Angular模块，可轻松集成到其他项目

#### 集成到现有项目

```typescript
// 在你的Angular项目中导入模块
import { CardComponentsModule } from './path/to/card-components.module';

@NgModule({
  imports: [
    // ... 其他模块
    CardComponentsModule
  ]
})
export class YourModule { }
```

## 测试功能

启动服务器后，可以尝试以下命令来体验不同功能：

- "你好" - 基础对话
- "帮助" - 查看功能列表  
- "北京天气" - 工具调用演示
- "计算 2+3" - 计算器工具
- "搜索 AG-UI" - 搜索工具

## 项目特色

这个实现完全基于原生技术栈，展示了AG-UI协议的核心功能，包括实时通信、事件处理、状态同步等特性。现在还集成了Angular组件实现，提供了多种前端技术选择，满足不同开发需求。