# AG-UI Angular 卡片组件

这个目录包含了基于AG-UI协议的Angular卡片组件实现，提供了一套完整的卡片渲染和状态管理解决方案。

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

## 使用方法

### 1. 导入模块

```typescript
import { CardComponentsModule } from './angular-card-components/card-components.module';

@NgModule({
  imports: [
    // ...
    CardComponentsModule
  ],
  // ...
})
export class AppModule { }
```

### 2. 在模板中使用

```html
<!-- 使用卡片渲染器 -->
<app-card-renderer></app-card-renderer>

<!-- 或者单独使用卡片组件 -->
<app-card 
  [card]="myCardData" 
  (action)="handleCardAction($event)"
></app-card>
```

### 3. 卡片数据结构

```typescript
interface CardData {
  id: string;
  title: string;
  content: string;
  status: CardStatus; // 'pending' | 'executing' | 'completed' | 'error'
  type: CardType;     // 'task' | 'tool_call' | 'message' | 'step' | string
  timestamp: string;
  progress: number;   // 0-100
  metadata?: any;     // 可选的元数据
}
```

## 事件处理

组件支持以下AG-UI协议事件：

- `STATE_SNAPSHOT` - 完整状态快照
- `STATE_DELTA` - 增量状态更新
- `TOOL_CALL_START/END` - 工具调用生命周期
- `TEXT_MESSAGE_START/CONTENT/END` - 文本消息生命周期
- `STEP_STARTED/FINISHED` - 步骤执行生命周期

## 模拟功能

卡片渲染器内置了两个模拟功能：

1. **模拟任务流程** - 模拟一个完整的任务执行流程，包括步骤开始、工具调用、消息生成和完成
2. **模拟状态更新** - 模拟通过状态快照和增量更新来管理卡片状态

## 样式定制

组件使用Angular的组件样式封装，可以通过修改组件中的样式定义来自定义外观。主要样式特点包括：

- 渐变背景和玻璃态效果
- 响应式卡片网格布局
- 状态感知的视觉处理（颜色、图标等）
- 动画过渡效果

## 与其他框架的比较

本实现与AG-UI协议的其他框架实现（React、Vue、原生JS）保持一致的事件处理模式和状态管理逻辑，同时利用了Angular特有的功能：

- 使用Angular的组件装饰器和模板语法
- 利用Angular的变更检测机制
- 使用NgFor和NgIf等内置指令
- 组件输入/输出绑定（@Input/@Output）
- Angular动画系统