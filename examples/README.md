# AG-UI 卡片组件动态渲染示例

本目录包含了基于AG-UI协议实现的卡片组件动态渲染示例，展示了如何利用AG-UI协议的事件机制和状态管理能力来实现丰富的UI交互体验。

## 示例概述

本示例集合展示了在不同前端框架中如何实现基于AG-UI协议的卡片组件动态渲染：

1. **原生HTML/JavaScript实现** (`card_components_ui.html`)
   - 使用原生JavaScript和DOM操作实现AG-UI协议的事件处理和UI渲染
   - 无需任何框架依赖，适合快速集成到任何Web项目

2. **React实现** (`react_card_components.tsx`)
   - 使用React框架实现AG-UI协议的组件化渲染
   - 利用React的状态管理和组件生命周期处理AG-UI事件
   - 使用Framer Motion实现流畅的动画效果

3. **Vue实现** (`vue_card_components.vue`)
   - 使用Vue框架实现AG-UI协议的组件化渲染
   - 利用Vue的响应式数据系统和组件化架构处理AG-UI事件
   - 使用Vue的过渡系统实现动画效果

## AG-UI协议卡片渲染核心概念

### 1. 事件驱动架构

AG-UI协议采用事件驱动架构，通过WebSocket实时传输各类事件：

- **状态事件**：`STATE_SNAPSHOT`和`STATE_DELTA`用于完整或增量更新UI状态
- **工具调用事件**：`TOOL_CALL_START`和`TOOL_CALL_END`用于表示工具调用的生命周期
- **消息事件**：`TEXT_MESSAGE_START`、`TEXT_MESSAGE_CONTENT`和`TEXT_MESSAGE_END`用于流式传输消息
- **步骤事件**：`STEP_STARTED`和`STEP_FINISHED`用于表示任务步骤的执行状态

### 2. 声明式UI渲染

通过AG-UI协议，后端可以声明式地描述UI状态，而无需关心具体的渲染实现：

```javascript
// 状态快照示例
{
  "event_type": "STATE_SNAPSHOT",
  "state": {
    "cards": {
      "card_1": {
        "title": "数据分析",
        "content": "分析用户行为数据",
        "status": "executing",
        "progress": 45
      }
    }
  }
}

// 状态增量示例
{
  "event_type": "STATE_DELTA",
  "delta": {
    "cards": {
      "card_1": {
        "status": "completed",
        "progress": 100
      }
    }
  }
}
```

### 3. 卡片组件状态管理

卡片组件的状态管理遵循以下原则：

- **完整替换**：通过`STATE_SNAPSHOT`事件完全替换当前UI状态
- **增量更新**：通过`STATE_DELTA`事件只更新变化的部分
- **事件映射**：将协议事件映射到UI组件状态变化

## 实现细节

### 事件处理流程

1. **连接建立**：与AG-UI服务器建立WebSocket连接
2. **事件监听**：注册各类事件的处理函数
3. **状态转换**：将接收到的事件转换为UI状态
4. **渲染更新**：基于状态变化更新UI组件

### 卡片组件设计

卡片组件是一种通用UI模式，适用于展示各类任务、工具调用和消息：

- **状态指示**：通过视觉元素（颜色、图标）表示不同状态（执行中、完成、错误）
- **进度展示**：通过进度条展示任务完成度
- **内容区域**：灵活展示文本、结构化数据或富媒体内容
- **交互控件**：提供操作按钮实现用户交互

### 动画与过渡效果

为提升用户体验，示例实现了多种动画效果：

- **卡片出现/消失**：平滑的淡入/淡出和位移效果
- **状态变化**：状态变化时的过渡动画
- **进度更新**：进度条的平滑增长动画
- **执行中状态**：脉动效果表示正在执行的任务

## 使用方法

### 原生HTML/JavaScript版本

1. 确保AG-UI服务器已启动（默认地址：`ws://localhost:8000/ws`）
2. 在浏览器中打开`card_components_ui.html`文件
3. 点击"连接服务器"按钮建立WebSocket连接
4. 使用模拟按钮测试不同类型的事件和状态更新

### React版本

1. 在React项目中导入`CardRenderer`组件：

```jsx
import CardRenderer from './react_card_components';

function App() {
  return (
    <CardRenderer 
      wsUrl="ws://localhost:8000/ws"
      onCardAction={(action, cardId) => {
        console.log(`执行操作: ${action} on card: ${cardId}`);
      }}
    />
  );
}
```

### Vue版本

1. 在Vue项目中导入并注册组件：

```javascript
import AGUICardRenderer from './vue_card_components.vue';

export default {
  components: {
    AGUICardRenderer
  }
}
```

2. 在模板中使用组件：

```html
<template>
  <div>
    <AGUICardRenderer />
  </div>
</template>
```

## 扩展与自定义

### 添加新的卡片类型

1. 在事件处理函数中添加新的事件类型处理
2. 设计新的卡片UI样式和交互逻辑
3. 在渲染函数中处理新的卡片类型

### 自定义样式

所有示例都提供了完整的样式定义，可以根据项目需求进行自定义：

- 修改颜色主题
- 调整卡片布局和尺寸
- 自定义动画效果
- 添加响应式设计

## 最佳实践

1. **状态规范化**：设计清晰的状态结构，避免冗余和嵌套过深
2. **增量更新**：优先使用`STATE_DELTA`进行小范围更新，减少数据传输
3. **错误处理**：妥善处理连接错误和事件解析异常
4. **性能优化**：大量卡片时考虑虚拟滚动或分页加载
5. **响应式设计**：确保在不同设备上都有良好的显示效果

## 与AG-UI协议的集成

这些示例展示了如何将AG-UI协议与前端UI框架无缝集成，实现声明式UI渲染和实时更新。通过这种方式，AI代理可以：

1. 声明式地描述所需的UI状态
2. 实时更新UI元素以响应用户交互和后台处理
3. 提供丰富的视觉反馈和交互体验

无论使用哪种前端技术栈，AG-UI协议都能提供一致的事件模型和状态管理机制，使开发者能够轻松构建动态、响应式的AI驱动界面。