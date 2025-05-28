<template>
  <div class="ag-ui-card-renderer">
    <!-- 头部 -->
    <div class="header">
      <h1>🎯 Vue AG-UI 卡片组件</h1>
      <p>基于AG-UI协议的Vue动态渲染示例</p>
    </div>

    <!-- 控制面板 -->
    <div class="controls">
      <button 
        class="btn primary" 
        @click="connect" 
        :disabled="connectionStatus === 'connected'"
      >
        连接服务器
      </button>
      <button 
        class="btn danger" 
        @click="disconnect" 
        :disabled="connectionStatus === 'disconnected'"
      >
        断开连接
      </button>
      <button class="btn" @click="simulateTaskFlow">模拟任务流程</button>
      <button class="btn" @click="simulateStateUpdate">模拟状态更新</button>
      <button class="btn" @click="clearCards">清空卡片</button>
      <div :class="['status', connectionStatus]">
        {{ connectionStatusText }}
      </div>
    </div>

    <!-- 卡片网格 -->
    <div class="cards-grid">
      <transition-group name="card">
        <card-component
          v-for="card in cardsArray"
          :key="card.id"
          :card="card"
          @action="handleCardAction"
        />
      </transition-group>
    </div>

    <!-- 日志面板 -->
    <div class="logs">
      <h3>事件日志</h3>
      <div class="logs-container" ref="logsContainer">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          <span class="log-timestamp">[{{ log.timestamp }}]</span>
          <span class="log-type">{{ log.type }}</span>
          <span>{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * Vue AG-UI 卡片组件动态渲染示例
 * 基于AG-UI协议实现的Vue组件，展示动态事件处理和UI渲染
 */
export default {
  name: 'AGUICardRenderer',
  components: {
    CardComponent: {
      props: {
        card: {
          type: Object,
          required: true
        }
      },
      template: `
        <div :class="['card', card.status]">
          <div class="card-header">
            <div class="card-title">{{ card.title }}</div>
            <div :class="['card-status', card.status]">{{ card.status }}</div>
          </div>
          <div class="card-content">{{ card.content }}</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: card.progress + '%' }"></div>
          </div>
          <div class="card-meta">
            <span>类型: {{ card.type }}</span>
            <span>{{ card.timestamp }}</span>
          </div>
          <div v-if="card.status === 'completed'" class="card-actions">
            <button @click="$emit('action', { action: 'view_details', cardId: card.id })" class="btn-action primary">
              查看详情
            </button>
            <button @click="$emit('action', { action: 'retry', cardId: card.id })" class="btn-action">
              重试
            </button>
          </div>
        </div>
      `
    }
  },
  data() {
    return {
      cards: new Map(),
      logs: [],
      connectionStatus: 'disconnected',
      ws: null,
      taskCounter: 0
    };
  },
  computed: {
    cardsArray() {
      return Array.from(this.cards.values());
    },
    connectionStatusText() {
      const statusMap = {
        'connected': '已连接',
        'connecting': '连接中',
        'disconnected': '未连接'
      };
      return statusMap[this.connectionStatus] || '未知状态';
    }
  },
  methods: {
    // 连接管理
    connect() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.addLog('WARNING', '已经连接到服务器');
        return;
      }

      this.connectionStatus = 'connecting';
      this.addLog('INFO', '正在连接到服务器');

      try {
        const wsUrl = 'ws://localhost:8000/ws';
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = this.handleOpen;
        this.ws.onmessage = this.handleMessage;
        this.ws.onclose = this.handleClose;
        this.ws.onerror = this.handleError;
      } catch (error) {
        this.addLog('ERROR', `连接错误: ${error.message}`);
        this.connectionStatus = 'disconnected';
      }
    },

    disconnect() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.connectionStatus = 'disconnected';
    },

    handleOpen() {
      this.connectionStatus = 'connected';
      this.addLog('SUCCESS', '已连接到AG-UI服务器');
    },

    handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        this.handleAGUIEvent(data);
      } catch (error) {
        this.addLog('ERROR', `解析消息失败: ${error.message}`);
      }
    },

    handleClose() {
      this.connectionStatus = 'disconnected';
      this.addLog('WARNING', '与服务器断开连接');
    },

    handleError(error) {
      this.addLog('ERROR', `连接错误: ${error}`);
    },

    // AG-UI 事件处理
    handleAGUIEvent(event) {
      this.addLog('EVENT', `收到事件: ${event.event_type}`);

      const handlers = {
        'STATE_SNAPSHOT': this.handleStateSnapshot,
        'STATE_DELTA': this.handleStateDelta,
        'TOOL_CALL_START': this.handleToolCallStart,
        'TOOL_CALL_END': this.handleToolCallEnd,
        'TEXT_MESSAGE_START': this.handleTextMessageStart,
        'TEXT_MESSAGE_CONTENT': this.handleTextMessageContent,
        'TEXT_MESSAGE_END': this.handleTextMessageEnd,
        'STEP_STARTED': this.handleStepStarted,
        'STEP_FINISHED': this.handleStepFinished
      };

      if (handlers[event.event_type]) {
        handlers[event.event_type](event);
      } else {
        this.addLog('WARNING', `未处理的事件类型: ${event.event_type}`);
      }
    },

    // 具体事件处理函数
    handleStateSnapshot(event) {
      if (event.state && event.state.cards) {
        this.cards = new Map();
        Object.entries(event.state.cards).forEach(([id, cardData]) => {
          this.cards.set(id, {
            id,
            title: cardData.title || '未知标题',
            content: cardData.content || '',
            status: cardData.status || 'pending',
            type: cardData.type || 'unknown',
            timestamp: cardData.timestamp || new Date().toLocaleTimeString(),
            progress: cardData.progress || 0,
            metadata: cardData.metadata
          });
        });
        this.addLog('UI', `从状态快照渲染了 ${this.cards.size} 个卡片`);
      }
    },

    handleStateDelta(event) {
      if (event.delta && event.delta.cards) {
        Object.entries(event.delta.cards).forEach(([id, updates]) => {
          const existingCard = this.cards.get(id);
          if (existingCard) {
            this.cards.set(id, { ...existingCard, ...updates });
          } else {
            this.cards.set(id, {
              id,
              title: updates.title || '未知标题',
              content: updates.content || '',
              status: updates.status || 'pending',
              type: updates.type || 'unknown',
              timestamp: updates.timestamp || new Date().toLocaleTimeString(),
              progress: updates.progress || 0,
              metadata: updates.metadata
            });
          }
        });
        this.addLog('UI', `通过状态增量更新了卡片`);
      }
    },

    handleToolCallStart(event) {
      const cardData = {
        id: event.call_id,
        title: `🔧 ${event.tool_name}`,
        content: `正在执行工具: ${event.tool_name}`,
        status: 'executing',
        type: 'tool_call',
        timestamp: new Date().toLocaleTimeString(),
        progress: 0,
        metadata: { arguments: event.arguments }
      };

      this.cards.set(event.call_id, cardData);
      this.addLog('TOOL', `工具调用开始: ${event.tool_name}`);
    },

    handleToolCallEnd(event) {
      const card = this.cards.get(event.call_id);
      if (card) {
        this.cards.set(event.call_id, {
          ...card,
          status: 'completed',
          content: `工具执行完成\n结果: ${JSON.stringify(event.result, null, 2)}`,
          progress: 100,
          metadata: { ...card.metadata, result: event.result }
        });
      }
      this.addLog('TOOL', `工具调用结束: ${event.call_id}`);
    },

    handleTextMessageStart(event) {
      const cardData = {
        id: event.message_id,
        title: `💬 ${event.role || 'assistant'} 消息`,
        content: '正在生成消息...',
        status: 'executing',
        type: 'message',
        timestamp: new Date().toLocaleTimeString(),
        progress: 0
      };

      this.cards.set(event.message_id, cardData);
      this.addLog('MESSAGE', `消息开始: ${event.message_id}`);
    },

    handleTextMessageContent(event) {
      const card = this.cards.get(event.message_id);
      if (card) {
        this.cards.set(event.message_id, {
          ...card,
          content: event.content || '',
          progress: Math.min(card.progress + 20, 90)
        });
      }
    },

    handleTextMessageEnd(event) {
      const card = this.cards.get(event.message_id);
      if (card) {
        this.cards.set(event.message_id, {
          ...card,
          status: 'completed',
          progress: 100
        });
      }
      this.addLog('MESSAGE', `消息结束: ${event.message_id}`);
    },

    handleStepStarted(event) {
      const cardData = {
        id: `step_${event.step_id}`,
        title: `📋 ${event.step_name || '未知步骤'}`,
        content: event.description || '执行中...',
        status: 'executing',
        type: 'step',
        timestamp: new Date().toLocaleTimeString(),
        progress: 0
      };

      this.cards.set(`step_${event.step_id}`, cardData);
      this.addLog('STEP', `步骤开始: ${event.step_name}`);
    },

    handleStepFinished(event) {
      const card = this.cards.get(`step_${event.step_id}`);
      if (card) {
        this.cards.set(`step_${event.step_id}`, {
          ...card,
          status: event.success ? 'completed' : 'error',
          content: event.result || card.content,
          progress: 100
        });
      }
      this.addLog('STEP', `步骤完成: ${event.step_id}`);
    },

    // 卡片操作
    handleCardAction({ action, cardId }) {
      this.addLog('ACTION', `卡片操作: ${action} on ${cardId}`);
      // 这里可以添加具体的操作逻辑
    },

    // 模拟功能
    simulateTaskFlow() {
      this.addLog('SIMULATE', '开始模拟任务流程');
      const taskId = `task_${++this.taskCounter}`;

      // 模拟步骤开始
      setTimeout(() => {
        this.handleStepStarted({
          event_type: 'STEP_STARTED',
          timestamp: Date.now(),
          step_id: `${taskId}_1`,
          step_name: '数据收集',
          description: '正在收集用户数据...'
        });
      }, 500);

      // 模拟工具调用
      setTimeout(() => {
        this.handleToolCallStart({
          event_type: 'TOOL_CALL_START',
          timestamp: Date.now(),
          call_id: `${taskId}_tool`,
          tool_name: 'data_processor',
          arguments: { input: 'user_data' }
        });
      }, 1500);

      // 模拟消息生成
      setTimeout(() => {
        this.handleTextMessageStart({
          event_type: 'TEXT_MESSAGE_START',
          timestamp: Date.now(),
          message_id: `${taskId}_msg`,
          role: 'assistant'
        });
      }, 2500);

      // 模拟完成
      setTimeout(() => {
        this.handleStepFinished({
          event_type: 'STEP_FINISHED',
          timestamp: Date.now(),
          step_id: `${taskId}_1`,
          success: true,
          result: '数据收集完成'
        });

        this.handleToolCallEnd({
          event_type: 'TOOL_CALL_END',
          timestamp: Date.now(),
          call_id: `${taskId}_tool`,
          result: { processed: 100, status: 'success' }
        });

        this.handleTextMessageEnd({
          event_type: 'TEXT_MESSAGE_END',
          timestamp: Date.now(),
          message_id: `${taskId}_msg`
        });
      }, 4000);
    },

    simulateStateUpdate() {
      this.addLog('SIMULATE', '模拟状态更新');

      const mockState = {
        cards: {
          'state_card_1': {
            title: '🎯 状态驱动卡片',
            content: '这是通过状态快照创建的卡片',
            status: 'completed',
            type: 'state',
            timestamp: new Date().toLocaleTimeString(),
            progress: 100
          },
          'state_card_2': {
            title: '📊 数据分析',
            content: '分析用户行为数据中...',
            status: 'executing',
            type: 'analysis',
            timestamp: new Date().toLocaleTimeString(),
            progress: 65
          }
        }
      };

      this.handleStateSnapshot({
        event_type: 'STATE_SNAPSHOT',
        timestamp: Date.now(),
        state: mockState
      });

      // 模拟增量更新
      setTimeout(() => {
        this.handleStateDelta({
          event_type: 'STATE_DELTA',
          timestamp: Date.now(),
          delta: {
            cards: {
              'state_card_2': {
                status: 'completed',
                content: '数据分析完成！发现了有趣的用户行为模式。',
                progress: 100
              }
            }
          }
        });
      }, 2000);
    },

    clearCards() {
      this.cards = new Map();
      this.addLog('UI', '已清空所有卡片');
    },

    // 日志方法
    addLog(type, message) {
      const timestamp = new Date().toLocaleTimeString();
      this.logs.push({ timestamp, type, message });
      
      // 保持最新100条日志
      if (this.logs.length > 100) {
        this.logs.shift();
      }
      
      this.$nextTick(() => {
        if (this.$refs.logsContainer) {
          this.$refs.logsContainer.scrollTop = this.$refs.logsContainer.scrollHeight;
        }
      });
    }
  },
  beforeDestroy() {
    // 组件销毁时关闭WebSocket连接
    if (this.ws) {
      this.ws.close();
    }
  }
};
</script>

<style scoped>
.ag-ui-card-renderer {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.controls {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.primary {
  background: #4CAF50;
  border-color: #45a049;
}

.btn.danger {
  background: #f44336;
  border-color: #da190b;
}

.status {
  color: white;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.status.connected {
  background: rgba(76, 175, 80, 0.8);
}

.status.disconnected {
  background: rgba(244, 67, 54, 0.8);
}

.status.connecting {
  background: rgba(255, 152, 0, 0.8);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card.pending {
  border-left: 4px solid #ff9800;
}

.card.completed {
  border-left: 4px solid #4CAF50;
}

.card.error {
  border-left: 4px solid #f44336;
}

.card.executing {
  border-left: 4px solid #2196F3;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.card-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.card-status.pending {
  background: #fff3cd;
  color: #856404;
}

.card-status.completed {
  background: #d4edda;
  color: #155724;
}

.card-status.error {
  background: #f8d7da;
  color: #721c24;
}

.card-status.executing {
  background: #cce5ff;
  color: #004085;
}

.card-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
  white-space: pre-wrap;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.btn-action {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
  transition: all 0.2s ease;
}

.btn-action:hover {
  background: #e9e9e9;
}

.btn-action.primary {
  background: #e3f2fd;
  border-color: #bbdefb;
  color: #1976d2;
}

.btn-action.primary:hover {
  background: #bbdefb;
}

.logs {
  background: rgba(0, 0, 0, 0.8);
  color: #00ff00;
  border-radius: 10px;
  padding: 20px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin-bottom: 20px;
}

.logs h3 {
  color: white;
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.4;
}

.log-entry {
  margin-bottom: 5px;
}

.log-timestamp {
  color: #888;
  margin-right: 10px;
}

.log-type {
  color: #ffff00;
  margin-right: 10px;
  font-weight: bold;
}

/* 卡片动画 */
.card-enter-active, .card-leave-active {
  transition: all 0.5s ease;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>