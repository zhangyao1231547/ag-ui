# Angular组件集成指南

本文档详细说明如何将AG-UI Angular卡片组件集成到native-ag-ui项目中。

## 概述

AG-UI Angular卡片组件是对native-ag-ui项目的扩展，提供了现代化的Angular组件实现，完全兼容现有的AG-UI协议和后端服务。

## 集成架构

```
native-ag-ui/
├── backend/                    # Python后端服务
│   ├── server.py              # 主服务器
│   ├── ag_ui_protocol.py      # AG-UI协议处理
│   └── websocket_handler.py   # WebSocket处理
├── frontend/                   # 前端实现
│   ├── index.html             # 原生Web界面
│   ├── script.js              # 原生JavaScript
│   ├── style.css              # 原生样式
│   └── angular-components/    # 新增Angular组件
│       ├── src/
│       │   ├── card.component.ts
│       │   ├── card-renderer.component.ts
│       │   └── card-components.module.ts
│       ├── package.json
│       └── angular.json
```

## 技术栈对比

| 特性 | 原生实现 | Angular组件 |
|------|----------|-------------|
| 技术栈 | HTML5 + CSS3 + Vanilla JS | Angular 17 + TypeScript |
| 组件化 | 无 | 完整组件系统 |
| 状态管理 | 手动DOM操作 | 响应式数据绑定 |
| 类型安全 | 无 | TypeScript强类型 |
| 动画效果 | CSS动画 | Angular Animations |
| 开发体验 | 基础 | 现代化IDE支持 |
| 构建工具 | 无需构建 | Angular CLI |

## 协议兼容性

两种实现都完全支持AG-UI协议的所有事件类型：

### 支持的事件类型

- `TEXT_MESSAGE_START` - 文本消息开始
- `TEXT_MESSAGE_CONTENT` - 文本消息内容
- `TEXT_MESSAGE_END` - 文本消息结束
- `TOOL_CALL_START` - 工具调用开始
- `TOOL_CALL_END` - 工具调用结束
- `STATE_SNAPSHOT` - 状态快照
- `STATE_DELTA` - 状态增量更新
- `STEP_STARTED` - 步骤开始
- `STEP_FINISHED` - 步骤完成
- `RUN_STARTED` - 运行开始
- `RUN_FINISHED` - 运行完成
- `RUN_ERROR` - 运行错误

### WebSocket连接

两种实现都连接到同一个WebSocket端点：
```
ws://localhost:8000/ws
```

## 快速开始

### 1. 启动后端服务

```bash
# 在native-ag-ui根目录
cd native-ag-ui
python server.py
```

### 2. 访问原生界面

```bash
# 浏览器访问
http://localhost:8000
```

### 3. 启动Angular组件

```bash
# 进入Angular组件目录
cd frontend/angular-components

# 安装依赖
npm install

# 启动开发服务器
npm start

# 浏览器访问
http://localhost:4201
```

## 组件详解

### CardComponent

单个卡片组件，负责渲染单个AG-UI事件：

```typescript
@Component({
  selector: 'app-card',
  template: `...`,
  animations: [cardAnimations]
})
export class CardComponent {
  @Input() card: CardData;
  @Output() action = new EventEmitter<CardAction>();
}
```

**特性：**
- 支持多种卡片状态（PENDING, EXECUTING, COMPLETED, ERROR）
- 支持多种卡片类型（TASK, TOOL_CALL, MESSAGE, STEP）
- 内置动画效果
- 响应式设计

### CardRendererComponent

卡片渲染器，负责WebSocket连接和事件处理：

```typescript
@Component({
  selector: 'app-card-renderer',
  template: `...`
})
export class CardRendererComponent {
  cards: Map<string, CardData> = new Map();
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  connect(): void { /* WebSocket连接逻辑 */ }
  handleAGUIEvent(event: any): void { /* 事件处理逻辑 */ }
}
```

**特性：**
- 完整的WebSocket连接管理
- AG-UI事件处理和分发
- 实时日志显示
- 模拟功能支持

### CardComponentsModule

Angular模块，封装所有卡片相关组件：

```typescript
@NgModule({
  declarations: [CardComponent, CardRendererComponent],
  imports: [CommonModule, BrowserAnimationsModule],
  exports: [CardComponent, CardRendererComponent]
})
export class CardComponentsModule { }
```

## 集成到现有项目

### 1. 复制组件文件

将`frontend/angular-components/src/`目录下的组件文件复制到你的Angular项目中。

### 2. 导入模块

```typescript
import { CardComponentsModule } from './path/to/card-components.module';

@NgModule({
  imports: [
    // ... 其他模块
    CardComponentsModule
  ]
})
export class YourModule { }
```

### 3. 使用组件

```html
<!-- 完整的卡片渲染器 -->
<app-card-renderer></app-card-renderer>

<!-- 或者单独使用卡片组件 -->
<app-card 
  [card]="cardData" 
  (action)="handleCardAction($event)">
</app-card>
```

## 自定义配置

### WebSocket端点配置

在`card-renderer.component.ts`中修改WebSocket连接地址：

```typescript
connect(): void {
  // 修改为你的WebSocket服务器地址
  const wsUrl = 'ws://your-server:port/ws';
  this.ws = new WebSocket(wsUrl);
}
```

### 样式自定义

组件使用CSS变量，可以轻松自定义主题：

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  /* ... 其他变量 */
}
```

## 开发指南

### 添加新的卡片类型

1. 在`card.component.ts`中扩展`CardType`枚举：

```typescript
export enum CardType {
  TASK = 'task',
  TOOL_CALL = 'tool_call',
  MESSAGE = 'message',
  STEP = 'step',
  YOUR_NEW_TYPE = 'your_new_type'  // 新增
}
```

2. 在模板中添加对应的样式和图标。

### 添加新的事件处理

在`card-renderer.component.ts`中添加新的事件处理函数：

```typescript
handleAGUIEvent(event: any): void {
  const handlers: Record<string, (event: any) => void> = {
    // ... 现有处理器
    'YOUR_NEW_EVENT': this.handleYourNewEvent.bind(this)
  };
}

handleYourNewEvent(event: any): void {
  // 处理新事件的逻辑
}
```

## 性能优化

### 1. OnPush变更检测

对于大量卡片的场景，可以使用OnPush变更检测策略：

```typescript
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class CardComponent {
  // ...
}
```

### 2. 虚拟滚动

对于大量卡片，可以使用Angular CDK的虚拟滚动：

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

// 在模板中使用
<cdk-virtual-scroll-viewport itemSize="200" class="cards-viewport">
  <app-card 
    *cdkVirtualFor="let card of cardsArray" 
    [card]="card">
  </app-card>
</cdk-virtual-scroll-viewport>
```

## 故障排除

### 常见问题

1. **WebSocket连接失败**
   - 确认后端服务器正在运行
   - 检查端口号是否正确
   - 确认防火墙设置

2. **组件不显示**
   - 确认已正确导入`CardComponentsModule`
   - 检查控制台是否有错误信息
   - 确认Angular版本兼容性

3. **样式问题**
   - 确认已导入全局样式文件
   - 检查CSS变量是否正确定义
   - 确认浏览器兼容性

### 调试技巧

1. **启用详细日志**：
   ```typescript
   // 在card-renderer.component.ts中
   addLog('DEBUG', `详细信息: ${JSON.stringify(data)}`);
   ```

2. **使用浏览器开发工具**：
   - Network标签查看WebSocket连接
   - Console标签查看错误信息
   - Elements标签检查DOM结构

## 贡献指南

欢迎为AG-UI Angular组件贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 代码规范

- 使用TypeScript严格模式
- 遵循Angular编码风格指南
- 添加适当的注释和文档
- 编写单元测试

## 许可证

本项目采用MIT许可证，详见LICENSE文件。