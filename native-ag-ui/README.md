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

- 💬 实时聊天界面
- 🔄 双向状态同步
- 🧩 结构化消息显示
- 🛠️ 工具调用支持
- 🎨 现代化UI设计
- 📱 移动端适配
- 🆕 **通义千问大模型集成**
  - 智能对话生成
  - 上下文理解
  - 多轮对话支持
  - 自动降级机制（API失败时使用模板响应）

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
## 使用方法
1. 访问界面 : 打开浏览器访问 http://localhost:8080
2. 开始对话 : 在输入框中输入消息，体验实时聊天
3. 测试功能 : 尝试以下命令来体验不同功能：
   
   - "你好" - 基础对话
   - "帮助" - 查看功能列表
   - "北京天气" - 工具调用演示
   - "计算 2+3" - 计算器工具
   - "搜索 AG-UI" - 搜索工具
4. 查看事件 : 右侧面板显示实时的AG-UI协议事件流
5. 主题切换 : 点击右上角按钮切换明暗主题
这个实现完全基于原生技术栈，展示了AG-UI协议的核心功能，包括实时通信、事件处理、状态同步等特性。前后端都已成功运行，可以在浏览器中体验完整的AG-UI交互功能！