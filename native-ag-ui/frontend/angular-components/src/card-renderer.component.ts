import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CardData, CardAction, CardStatus, CardType } from './card.component';

/**
 * AG-UI事件类型枚举
 */
enum EventType {
  TEXT_MESSAGE_START = 'TEXT_MESSAGE_START',
  TEXT_MESSAGE_CONTENT = 'TEXT_MESSAGE_CONTENT',
  TEXT_MESSAGE_END = 'TEXT_MESSAGE_END',
  TOOL_CALL_START = 'TOOL_CALL_START',
  TOOL_CALL_END = 'TOOL_CALL_END',
  STATE_SNAPSHOT = 'STATE_SNAPSHOT',
  STATE_DELTA = 'STATE_DELTA',
  STEP_STARTED = 'STEP_STARTED',
  STEP_FINISHED = 'STEP_FINISHED',
  RUN_STARTED = 'RUN_STARTED',
  RUN_FINISHED = 'RUN_FINISHED',
  RUN_ERROR = 'RUN_ERROR'
}

/**
 * 日志条目接口
 */
interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
}

/**
 * AG-UI卡片渲染器组件
 * 基于AG-UI协议实现的Angular组件，展示动态事件处理和UI渲染
 * 与native-ag-ui后端完全兼容
 */
@Component({
  selector: 'app-card-renderer',
  template: `
    <div class="ag-ui-card-renderer">
      <!-- 头部 -->
      <div class="header">
        <h1>🎯 AG-UI Angular 卡片组件</h1>
        <p>基于AG-UI协议的Angular动态渲染系统 - 集成到native-ag-ui</p>
      </div>

      <!-- 控制面板 -->
      <div class="controls">
        <button 
          class="btn primary" 
          (click)="connect()" 
          [disabled]="connectionStatus === 'connected'"
        >
          连接服务器
        </button>
        <button 
          class="btn danger" 
          (click)="disconnect()" 
          [disabled]="connectionStatus === 'disconnected'"
        >
          断开连接
        </button>
        <button class="btn" (click)="simulateTaskFlow()">模拟任务流程</button>
        <button class="btn" (click)="simulateStateUpdate()">模拟状态更新</button>
        <button class="btn" (click)="clearCards()">清空卡片</button>
        <div class="status" [ngClass]="connectionStatus">
          {{ connectionStatusText }}
        </div>
      </div>

      <!-- 卡片网格 -->
      <div class="cards-grid">
        <app-card 
          *ngFor="let card of cardsArray" 
          [card]="card"
          (action)="handleCardAction($event)"
        ></app-card>
      </div>

      <!-- 日志面板 -->
      <div class="logs">
        <h3>事件日志</h3>
        <div class="logs-container" #logsContainer>
          <div *ngFor="let log of logs" class="log-entry">
            <span class="log-timestamp">[{{ log.timestamp }}]</span>
            <span class="log-type">{{ log.type }}</span>
            <span>{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
  `]
})
export class CardRendererComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('logsContainer') logsContainer!: ElementRef;

  // 卡片数据
  cards: Map<string, CardData> = new Map();
  cardsArray: CardData[] = [];

  // 日志
  logs: LogEntry[] = [];

  // 连接状态
  connectionStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
  ws: WebSocket | null = null;
  taskCounter = 0;

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // 组件销毁时关闭WebSocket连接
    this.disconnect();
  }

  ngAfterViewChecked(): void {
    // 滚动日志到底部
    this.scrollLogsToBottom();
  }

  get connectionStatusText(): string {
    const statusMap = {
      'connected': '已连接',
      'connecting': '连接中',
      'disconnected': '未连接'
    };
    return statusMap[this.connectionStatus] || '未知状态';
  }

  // 连接管理 - 连接到native-ag-ui后端
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.addLog('WARNING', '已经连接到服务器');
      return;
    }

    this.connectionStatus = 'connecting';
    this.addLog('INFO', '正在连接到native-ag-ui后端服务器');

    try {
      // 连接到native-ag-ui的WebSocket服务器
      const wsUrl = 'ws://localhost:8000/ws';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      this.addLog('ERROR', `连接错误: ${error instanceof Error ? error.message : String(error)}`);
      this.connectionStatus = 'disconnected';
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
    this.addLog('INFO', '已断开连接');
  }

  handleOpen(): void {
    this.connectionStatus = 'connected';
    this.addLog('SUCCESS', '已连接到native-ag-ui后端服务器');
  }

  handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.handleAGUIEvent(data);
    } catch (error) {
      this.addLog('ERROR', `解析消息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  handleClose(): void {
    this.connectionStatus = 'disconnected';
    this.addLog('WARNING', '与native-ag-ui后端断开连接');
  }

  handleError(error: Event): void {
    this.addLog('ERROR', `连接错误: ${error}`);
  }

  // AG-UI 事件处理
  handleAGUIEvent(event: any): void {
    this.addLog('EVENT', `收到事件: ${event.event_type}`);

    const handlers: Record<string, (event: any) => void> = {
      [EventType.STATE_SNAPSHOT]: this.handleStateSnapshot.bind(this),
      [EventType.STATE_DELTA]: this.handleStateDelta.bind(this),
      [EventType.TOOL_CALL_START]: this.handleToolCallStart.bind(this),
      [EventType.TOOL_CALL_END]: this.handleToolCallEnd.bind(this),
      [EventType.TEXT_MESSAGE_START]: this.handleTextMessageStart.bind(this),
      [EventType.TEXT_MESSAGE_CONTENT]: this.handleTextMessageContent.bind(this),
      [EventType.TEXT_MESSAGE_END]: this.handleTextMessageEnd.bind(this),
      [EventType.STEP_STARTED]: this.handleStepStarted.bind(this),
      [EventType.STEP_FINISHED]: this.handleStepFinished.bind(this)
    };

    if (handlers[event.event_type]) {
      handlers[event.event_type](event);
    } else {
      this.addLog('WARNING', `未处理的事件类型: ${event.event_type}`);
    }

    // 更新卡片数组
    this.updateCardsArray();
  }

  // 具体事件处理函数
  handleStateSnapshot(event: any): void {
    if (event.state && event.state.cards) {
      this.cards = new Map();
      Object.entries(event.state.cards).forEach(([id, cardData]: [string, any]) => {
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
  }

  handleStateDelta(event: any): void {
    if (event.delta && event.delta.cards) {
      Object.entries(event.delta.cards).forEach(([id, updates]: [string, any]) => {
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
  }

  handleToolCallStart(event: any): void {
    const cardData: CardData = {
      id: event.call_id,
      title: `🔧 ${event.tool_name}`,
      content: `正在执行工具: ${event.tool_name}`,
      status: CardStatus.EXECUTING,
      type: CardType.TOOL_CALL,
      timestamp: new Date().toLocaleTimeString(),
      progress: 0,
      metadata: { arguments: event.arguments }
    };

    this.cards.set(event.call_id, cardData);
    this.addLog('TOOL', `工具调用开始: ${event.tool_name}`);
  }

  handleToolCallEnd(event: any): void {
    const card = this.cards.get(event.call_id);
    if (card) {
      this.cards.set(event.call_id, {
        ...card,
        status: CardStatus.COMPLETED,
        content: `工具执行完成\n结果: ${JSON.stringify(event.result, null, 2)}`,
        progress: 100,
        metadata: { ...card.metadata, result: event.result }
      });
    }
    this.addLog('TOOL', `工具调用结束: ${event.call_id}`);
  }

  handleTextMessageStart(event: any): void {
    const cardData: CardData = {
      id: event.message_id,
      title: `💬 ${event.role || 'assistant'} 消息`,
      content: '正在生成消息...',
      status: CardStatus.EXECUTING,
      type: CardType.MESSAGE,
      timestamp: new Date().toLocaleTimeString(),
      progress: 0
    };

    this.cards.set(event.message_id, cardData);
    this.addLog('MESSAGE', `消息开始: ${event.message_id}`);
  }

  handleTextMessageContent(event: any): void {
    const card = this.cards.get(event.message_id);
    if (card) {
      this.cards.set(event.message_id, {
        ...card,
        content: event.content || '',
        progress: Math.min(card.progress + 20, 90)
      });
    }
  }

  handleTextMessageEnd(event: any): void {
    const card = this.cards.get(event.message_id);
    if (card) {
      this.cards.set(event.message_id, {
        ...card,
        status: CardStatus.COMPLETED,
        progress: 100
      });
    }
    this.addLog('MESSAGE', `消息结束: ${event.message_id}`);
  }

  handleStepStarted(event: any): void {
    const cardData: CardData = {
      id: `step_${event.step_id}`,
      title: `📋 ${event.step_name || '未知步骤'}`,
      content: event.description || '执行中...',
      status: CardStatus.EXECUTING,
      type: CardType.STEP,
      timestamp: new Date().toLocaleTimeString(),
      progress: 0
    };

    this.cards.set(`step_${event.step_id}`, cardData);
    this.addLog('STEP', `步骤开始: ${event.step_name}`);
  }

  handleStepFinished(event: any): void {
    const card = this.cards.get(`step_${event.step_id}`);
    if (card) {
      this.cards.set(`step_${event.step_id}`, {
        ...card,
        status: event.success ? CardStatus.COMPLETED : CardStatus.ERROR,
        content: event.result || card.content,
        progress: 100
      });
    }
    this.addLog('STEP', `步骤完成: ${event.step_id}`);
  }

  // 卡片操作
  handleCardAction(action: CardAction): void {
    this.addLog('ACTION', `卡片操作: ${action.action} on ${action.cardId}`);
    // 这里可以添加具体的操作逻辑
  }

  // 模拟功能
  simulateTaskFlow(): void {
    this.addLog('SIMULATE', '开始模拟任务流程');
    const taskId = `task_${++this.taskCounter}`;

    // 模拟步骤开始
    setTimeout(() => {
      this.handleStepStarted({
        event_type: EventType.STEP_STARTED,
        timestamp: Date.now(),
        step_id: `${taskId}_1`,
        step_name: '数据收集',
        description: '正在收集用户数据...'
      });
    }, 500);

    // 模拟工具调用
    setTimeout(() => {
      this.handleToolCallStart({
        event_type: EventType.TOOL_CALL_START,
        timestamp: Date.now(),
        call_id: `${taskId}_tool`,
        tool_name: 'data_processor',
        arguments: { input: 'user_data' }
      });
    }, 1500);

    // 模拟消息生成
    setTimeout(() => {
      this.handleTextMessageStart({
        event_type: EventType.TEXT_MESSAGE_START,
        timestamp: Date.now(),
        message_id: `${taskId}_msg`,
        role: 'assistant'
      });
    }, 2500);

    // 模拟完成
    setTimeout(() => {
      this.handleStepFinished({
        event_type: EventType.STEP_FINISHED,
        timestamp: Date.now(),
        step_id: `${taskId}_1`,
        success: true,
        result: '数据收集完成'
      });

      this.handleToolCallEnd({
        event_type: EventType.TOOL_CALL_END,
        timestamp: Date.now(),
        call_id: `${taskId}_tool`,
        result: { processed: 100, status: 'success' }
      });

      this.handleTextMessageEnd({
        event_type: EventType.TEXT_MESSAGE_END,
        timestamp: Date.now(),
        message_id: `${taskId}_msg`
      });
    }, 4000);
  }

  simulateStateUpdate(): void {
    this.addLog('SIMULATE', '模拟状态更新');

    const mockState = {
      cards: {
        'state_card_1': {
          title: '🎯 状态驱动卡片',
          content: '这是通过状态快照创建的卡片',
          status: CardStatus.COMPLETED,
          type: CardType.TASK,
          timestamp: new Date().toLocaleTimeString(),
          progress: 100
        },
        'state_card_2': {
          title: '📊 数据分析',
          content: '分析用户行为数据中...',
          status: CardStatus.EXECUTING,
          type: 'analysis',
          timestamp: new Date().toLocaleTimeString(),
          progress: 65
        }
      }
    };

    this.handleStateSnapshot({
      event_type: EventType.STATE_SNAPSHOT,
      timestamp: Date.now(),
      state: mockState
    });

    // 模拟增量更新
    setTimeout(() => {
      this.handleStateDelta({
        event_type: EventType.STATE_DELTA,
        timestamp: Date.now(),
        delta: {
          cards: {
            'state_card_2': {
              status: CardStatus.COMPLETED,
              content: '数据分析完成！发现了有趣的用户行为模式。',
              progress: 100
            }
          }
        }
      });
    }, 2000);
  }

  clearCards(): void {
    this.cards = new Map();
    this.cardsArray = [];
    this.addLog('UI', '已清空所有卡片');
  }

  // 更新卡片数组
  updateCardsArray(): void {
    this.cardsArray = Array.from(this.cards.values());
  }

  // 日志方法
  addLog(type: string, message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push({ timestamp, type, message });
    
    // 保持最新100条日志
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  // 滚动日志到底部
  scrollLogsToBottom(): void {
    if (this.logsContainer) {
      const element = this.logsContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}