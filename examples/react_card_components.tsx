/**
 * React AG-UI 卡片组件动态渲染示例
 * 基于AG-UI协议实现的React组件，展示动态事件处理和UI渲染
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// 简化的动画组件，替代framer-motion
const motion = {
  div: ({ children, className, style, ...props }: any) => (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  )
};

const AnimatePresence = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

// AG-UI 事件类型定义
type AGUIEventType = 
  | 'STATE_SNAPSHOT'
  | 'STATE_DELTA'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_END'
  | 'TEXT_MESSAGE_START'
  | 'TEXT_MESSAGE_CONTENT'
  | 'TEXT_MESSAGE_END'
  | 'STEP_STARTED'
  | 'STEP_FINISHED';

// 卡片状态类型
type CardStatus = 'pending' | 'executing' | 'completed' | 'error';

// 卡片数据接口
interface CardData {
  id: string;
  title: string;
  content: string;
  status: CardStatus;
  type: string;
  timestamp: string;
  progress: number;
  metadata?: Record<string, any>;
}

// AG-UI 事件接口
interface AGUIEvent {
  event_type: AGUIEventType;
  timestamp: number;
  [key: string]: any;
}

// 状态快照事件
interface StateSnapshotEvent extends AGUIEvent {
  event_type: 'STATE_SNAPSHOT';
  state: {
    cards?: Record<string, Partial<CardData>>;
    [key: string]: any;
  };
}

// 状态增量事件
interface StateDeltaEvent extends AGUIEvent {
  event_type: 'STATE_DELTA';
  delta: {
    cards?: Record<string, Partial<CardData>>;
    [key: string]: any;
  };
}

// 工具调用开始事件
interface ToolCallStartEvent extends AGUIEvent {
  event_type: 'TOOL_CALL_START';
  call_id: string;
  tool_name: string;
  arguments?: Record<string, any>;
}

// 工具调用结束事件
interface ToolCallEndEvent extends AGUIEvent {
  event_type: 'TOOL_CALL_END';
  call_id: string;
  result?: any;
}

// 文本消息事件
interface TextMessageEvent extends AGUIEvent {
  message_id: string;
  content?: string;
  role?: string;
}

// 步骤事件
interface StepEvent extends AGUIEvent {
  step_id: string;
  step_name?: string;
  description?: string;
  success?: boolean;
  result?: any;
}

// 卡片组件属性
interface CardComponentProps {
  card: CardData;
  onAction?: (action: string, cardId: string) => void;
}

// 卡片组件
const CardComponent: React.FC<CardComponentProps> = ({ card, onAction }) => {
  const getStatusColor = (status: CardStatus) => {
    switch (status) {
      case 'pending': return 'border-yellow-400 bg-yellow-50';
      case 'executing': return 'border-blue-400 bg-blue-50';
      case 'completed': return 'border-green-400 bg-green-50';
      case 'error': return 'border-red-400 bg-red-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getStatusIcon = (status: CardStatus) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'executing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📋';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tool_call': return '🔧';
      case 'message': return '💬';
      case 'step': return '📋';
      case 'analysis': return '📊';
      case 'state': return '🎯';
      default: return '📄';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={`
        relative overflow-hidden rounded-xl border-l-4 p-6 shadow-lg backdrop-blur-sm
        transition-all duration-300 hover:shadow-xl
        ${getStatusColor(card.status)}
      `}
    >
      {/* 执行中的动画效果 */}
      {card.status === 'executing' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />
      )}

      {/* 卡片头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getTypeIcon(card.type)}</span>
          <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(card.status)}</span>
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide
            ${card.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : ''}
            ${card.status === 'executing' ? 'bg-blue-200 text-blue-800' : ''}
            ${card.status === 'completed' ? 'bg-green-200 text-green-800' : ''}
            ${card.status === 'error' ? 'bg-red-200 text-red-800' : ''}
          `}>
            {card.status}
          </span>
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {card.content}
        </p>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>进度</span>
          <span>{card.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              card.status === 'completed' ? 'bg-green-500' :
              card.status === 'error' ? 'bg-red-500' :
              card.status === 'executing' ? 'bg-blue-500' :
              'bg-yellow-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${card.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 卡片元数据 */}
      <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
        <span>类型: {card.type}</span>
        <span>{card.timestamp}</span>
      </div>

      {/* 操作按钮 */}
      {card.status === 'completed' && onAction && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => onAction('view_details', card.id)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            查看详情
          </button>
          <button
            onClick={() => onAction('retry', card.id)}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            重试
          </button>
        </div>
      )}
    </motion.div>
  );
};

// 主要的卡片渲染器组件
interface CardRendererProps {
  wsUrl?: string;
  onCardAction?: (action: string, cardId: string) => void;
}

// 🆕 动态内容生成器类
class DynamicContentGenerator {
  // 根据事件类型生成动态文案
  generateContent(eventType: string, data?: any): string {
    const templates: Record<string, string[]> = {
      'TEXT_MESSAGE_START': [
        '🤖 AI正在思考中...',
        '💭 正在组织语言...',
        '✨ 智能回复生成中...'
      ],
      'TEXT_MESSAGE_CONTENT': [
        '📝 内容正在流式输出...',
        '⚡ 实时生成文本中...',
        '🔄 动态更新内容...'
      ],
      'TOOL_CALL_START': [
        '🔧 工具调用启动中...',
        '⚙️ 执行智能工具...',
        '🛠️ 处理复杂任务...'
      ],
      'STEP_STARTED': [
        '📋 步骤执行开始...',
        '🎯 任务分解处理...',
        '⏳ 流程进行中...'
      ],
      'STATE_DELTA': [
        '🔄 状态更新中...',
        '📊 数据同步中...',
        '⚡ 实时更新...'
      ]
    };
    
    const options = templates[eventType] || ['🔄 处理中...'];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }
  
  // 根据进度生成状态文案
  generateProgressText(progress: number, type?: string): string {
    if (progress < 30) {
      return type === 'message' ? '🚀 开始生成...' : '⏳ 初始化中...';
    } else if (progress < 70) {
      return type === 'message' ? '📝 内容生成中...' : '⚡ 处理中...';
    } else if (progress < 100) {
      return type === 'message' ? '✨ 即将完成...' : '🔄 最后处理...';
    } else {
      return '✅ 完成！';
    }
  }
}

const CardRenderer: React.FC<CardRendererProps> = ({ 
  wsUrl = 'ws://localhost:8000/ws',
  onCardAction 
}) => {
  const [cards, setCards] = useState<Map<string, CardData>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [logs, setLogs] = useState<Array<{ timestamp: string; type: string; message: string }>>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const taskCounterRef = useRef(0);
  const dynamicContentGenerator = useRef(new DynamicContentGenerator());

  // 日志记录函数
  const addLog = useCallback((type: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => {
      const newLogs = [...prev, { timestamp, type, message }];
      return newLogs.slice(-100); // 保持最新100条日志
    });
  }, []);

  // WebSocket 连接管理
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog('WARNING', '已经连接到服务器');
      return;
    }

    setConnectionStatus('connecting');
    addLog('INFO', `正在连接到 ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      addLog('SUCCESS', '已连接到AG-UI服务器');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleAGUIEvent(data);
      } catch (error) {
        addLog('ERROR', `解析消息失败: ${error}`);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      addLog('WARNING', '与服务器断开连接');
    };

    ws.onerror = (error) => {
      addLog('ERROR', `连接错误: ${error}`);
    };
  }, [wsUrl, addLog]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  // AG-UI 事件处理
  const handleAGUIEvent = useCallback((event: AGUIEvent) => {
    addLog('EVENT', `收到事件: ${event.event_type}`);

    switch (event.event_type) {
      case 'STATE_SNAPSHOT':
        handleStateSnapshot(event as StateSnapshotEvent);
        break;
      case 'STATE_DELTA':
        handleStateDelta(event as StateDeltaEvent);
        break;
      case 'TOOL_CALL_START':
        handleToolCallStart(event as ToolCallStartEvent);
        break;
      case 'TOOL_CALL_END':
        handleToolCallEnd(event as ToolCallEndEvent);
        break;
      case 'TEXT_MESSAGE_START':
        handleTextMessageStart(event as TextMessageEvent);
        break;
      case 'TEXT_MESSAGE_CONTENT':
        handleTextMessageContent(event as TextMessageEvent);
        break;
      case 'TEXT_MESSAGE_END':
        handleTextMessageEnd(event as TextMessageEvent);
        break;
      case 'STEP_STARTED':
        handleStepStarted(event as StepEvent);
        break;
      case 'STEP_FINISHED':
        handleStepFinished(event as StepEvent);
        break;
      default:
        addLog('WARNING', `未处理的事件类型: ${event.event_type}`);
    }
  }, [addLog]);

  // 具体事件处理函数
  const handleStateSnapshot = useCallback((event: StateSnapshotEvent) => {
    if (event.state.cards) {
      const newCards = new Map<string, CardData>();
      Object.entries(event.state.cards).forEach(([id, cardData]) => {
        newCards.set(id, {
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
      setCards(newCards);
      addLog('UI', `从状态快照渲染了 ${newCards.size} 个卡片`);
    }
  }, [addLog]);

  const handleStateDelta = useCallback((event: StateDeltaEvent) => {
    if (event.delta.cards) {
      setCards(prev => {
        const newCards = new Map(prev);
        Object.entries(event.delta.cards!).forEach(([id, updates]) => {
          const existingCard = newCards.get(id);
          if (existingCard) {
            newCards.set(id, { ...existingCard, ...updates });
          } else {
            newCards.set(id, {
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
        return newCards;
      });
      addLog('UI', `通过状态增量更新了卡片`);
    }
  }, [addLog]);

  const handleToolCallStart = useCallback((event: ToolCallStartEvent) => {
    const cardData: CardData = {
      id: event.call_id,
      title: `🔧 ${event.tool_name}`,
      content: `正在执行工具: ${event.tool_name}`,
      status: 'executing',
      type: 'tool_call',
      timestamp: new Date().toLocaleTimeString(),
      progress: 0,
      metadata: { arguments: event.arguments }
    };

    setCards(prev => new Map(prev).set(event.call_id, cardData));
    addLog('TOOL', `工具调用开始: ${event.tool_name}`);
  }, [addLog]);

  const handleToolCallEnd = useCallback((event: ToolCallEndEvent) => {
    setCards(prev => {
      const newCards = new Map(prev);
      const card = newCards.get(event.call_id);
      if (card) {
        const completionText = dynamicContentGenerator.current.generateProgressText(100);
        newCards.set(event.call_id, {
          ...card,
          status: 'completed',
          content: `${completionText}\n工具执行完成\n结果: ${JSON.stringify(event.result, null, 2)}`,
          progress: 100,
          metadata: { ...card.metadata, result: event.result }
        });
      }
      return newCards;
    });
    addLog('TOOL', `工具调用结束: ${event.call_id}`);
  }, [addLog]);

  const handleTextMessageStart = useCallback((event: TextMessageEvent) => {
    const dynamicContent = dynamicContentGenerator.current.generateContent('TEXT_MESSAGE_START', event);
    const cardData: CardData = {
      id: event.message_id,
      title: `💬 ${event.role || 'assistant'} 消息`,
      content: dynamicContent,
      status: 'executing',
      type: 'message',
      timestamp: new Date().toLocaleTimeString(),
      progress: 0
    };

    setCards(prev => new Map(prev).set(event.message_id, cardData));
    addLog('MESSAGE', `消息开始: ${event.message_id}`);
  }, [addLog]);

  const handleTextMessageContent = useCallback((event: TextMessageEvent) => {
    setCards(prev => {
      const newCards = new Map(prev);
      const card = newCards.get(event.message_id);
      if (card) {
        newCards.set(event.message_id, {
          ...card,
          content: event.content || '',
          progress: Math.min(card.progress + 20, 90)
        });
      }
      return newCards;
    });
  }, []);

  const handleTextMessageEnd = useCallback((event: TextMessageEvent) => {
    setCards(prev => {
      const newCards = new Map(prev);
      const card = newCards.get(event.message_id);
      if (card) {
        const completionText = dynamicContentGenerator.current.generateProgressText(100);
        newCards.set(event.message_id, {
          ...card,
          status: 'completed',
          content: `${card.content}\n\n${completionText}`,
          progress: 100
        });
      }
      return newCards;
    });
    addLog('MESSAGE', `消息结束: ${event.message_id}`);
  }, [addLog]);

  const handleStepStarted = useCallback((event: StepEvent) => {
    const dynamicContent = dynamicContentGenerator.current.generateContent('STEP_STARTED', event);
    const cardData: CardData = {
      id: `step_${event.step_id}`,
      title: `📋 ${event.step_name || '未知步骤'}`,
      content: dynamicContent,
      status: 'executing',
      type: 'step',
      timestamp: new Date().toLocaleTimeString(),
      progress: 0
    };

    setCards(prev => new Map(prev).set(`step_${event.step_id}`, cardData));
    addLog('STEP', `步骤开始: ${event.step_name}`);
  }, [addLog]);

  const handleStepFinished = useCallback((event: StepEvent) => {
    setCards(prev => {
      const newCards = new Map(prev);
      const card = newCards.get(`step_${event.step_id}`);
      if (card) {
        const completionText = dynamicContentGenerator.current.generateProgressText(100);
        newCards.set(`step_${event.step_id}`, {
          ...card,
          status: event.success ? 'completed' : 'error',
          content: `${card.content}\n\n${completionText}\n${event.result || ''}`,
          progress: 100
        });
      }
      return newCards;
    });
    addLog('STEP', `步骤完成: ${event.step_id}`);
  }, [addLog]);

  // 模拟功能
  const simulateTaskFlow = useCallback(() => {
    addLog('SIMULATE', '开始模拟任务流程');
    const taskId = `task_${++taskCounterRef.current}`;

    // 模拟步骤开始
    setTimeout(() => {
      handleStepStarted({
        event_type: 'STEP_STARTED',
        timestamp: Date.now(),
        step_id: `${taskId}_1`,
        step_name: '数据收集',
        description: '正在收集用户数据...'
      });
    }, 500);

    // 模拟工具调用
    setTimeout(() => {
      handleToolCallStart({
        event_type: 'TOOL_CALL_START',
        timestamp: Date.now(),
        call_id: `${taskId}_tool`,
        tool_name: 'data_processor',
        arguments: { input: 'user_data' }
      });
    }, 1500);

    // 模拟消息生成
    setTimeout(() => {
      handleTextMessageStart({
        event_type: 'TEXT_MESSAGE_START',
        timestamp: Date.now(),
        message_id: `${taskId}_msg`,
        role: 'assistant'
      });
    }, 2500);

    // 模拟消息内容更新
    setTimeout(() => {
      handleTextMessageContent({
        event_type: 'TEXT_MESSAGE_CONTENT',
        timestamp: Date.now(),
        message_id: `${taskId}_msg`,
        content: dynamicContentGenerator.current.generateContent('TEXT_MESSAGE_START', { role: 'assistant' })
      });
    }, 3000);

    // 模拟完成
    setTimeout(() => {
      handleStepFinished({
        event_type: 'STEP_FINISHED',
        timestamp: Date.now(),
        step_id: `${taskId}_1`,
        success: true,
        result: '数据收集完成'
      });

      handleToolCallEnd({
        event_type: 'TOOL_CALL_END',
        timestamp: Date.now(),
        call_id: `${taskId}_tool`,
        result: { processed: 100, status: 'success' }
      });

      handleTextMessageEnd({
        event_type: 'TEXT_MESSAGE_END',
        timestamp: Date.now(),
        message_id: `${taskId}_msg`
      });
    }, 4000);
  }, [addLog, handleStepStarted, handleToolCallStart, handleTextMessageStart, handleTextMessageContent, handleStepFinished, handleToolCallEnd, handleTextMessageEnd]);

  const simulateStateUpdate = useCallback(() => {
    addLog('SIMULATE', '模拟状态更新');

    const dynamicContent1 = dynamicContentGenerator.current.generateContent('STATE_DELTA', {});
    const dynamicContent2 = dynamicContentGenerator.current.generateContent('STATE_DELTA', {});

    const mockState = {
      cards: {
        'state_card_1': {
          title: '🎯 状态驱动卡片',
          content: dynamicContent1,
          status: 'completed' as CardStatus,
          type: 'state',
          timestamp: new Date().toLocaleTimeString(),
          progress: 100
        },
        'state_card_2': {
          title: '📊 数据分析',
          content: dynamicContent2,
          status: 'executing' as CardStatus,
          type: 'analysis',
          timestamp: new Date().toLocaleTimeString(),
          progress: 65
        }
      }
    };

    handleStateSnapshot({
      event_type: 'STATE_SNAPSHOT',
      timestamp: Date.now(),
      state: mockState
    });

    // 模拟增量更新
    setTimeout(() => {
      const completionText = dynamicContentGenerator.current.generateProgressText(100);
      handleStateDelta({
        event_type: 'STATE_DELTA',
        timestamp: Date.now(),
        delta: {
          cards: {
            'state_card_2': {
              status: 'completed' as CardStatus,
              content: `${completionText}\n数据分析完成！发现了有趣的用户行为模式。`,
              progress: 100
            }
          }
        }
      });
    }, 2000);
  }, [addLog, handleStateSnapshot, handleStateDelta]);

  const clearCards = useCallback(() => {
    setCards(new Map());
    addLog('UI', '已清空所有卡片');
  }, [addLog]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🎯 React AG-UI 卡片组件</h1>
          <p className="text-lg opacity-90">基于AG-UI协议的React动态渲染示例</p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={connect}
              disabled={connectionStatus === 'connected'}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              连接服务器
            </button>
            <button
              onClick={disconnect}
              disabled={connectionStatus === 'disconnected'}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              断开连接
            </button>
            <button
              onClick={simulateTaskFlow}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              模拟任务流程
            </button>
            <button
              onClick={simulateStateUpdate}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              模拟状态更新
            </button>
            <button
              onClick={clearCards}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              清空卡片
            </button>
            <div className={`px-4 py-2 rounded-lg text-white font-medium ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}>
              {connectionStatus === 'connected' ? '已连接' :
               connectionStatus === 'connecting' ? '连接中' :
               '未连接'}
            </div>
          </div>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AnimatePresence>
            {Array.from(cards.values()).map((card) => (
              <CardComponent
                key={card.id}
                card={card}
                onAction={onCardAction}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* 日志面板 */}
        <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-white text-lg font-semibold mb-4">事件日志</h3>
          <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="text-green-400 mb-1">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className="text-yellow-400 ml-2 font-bold">{log.type}</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardRenderer;

// 使用示例组件
export const CardRendererExample: React.FC = () => {
  const handleCardAction = (action: string, cardId: string) => {
    console.log(`执行操作: ${action} on card: ${cardId}`);
    // 这里可以添加具体的操作逻辑
  };

  return (
    <CardRenderer
      wsUrl="ws://localhost:8000/ws"
      onCardAction={handleCardAction}
    />
  );
};

// 导出类型定义供其他组件使用
export type {
  CardData,
  CardStatus,
  AGUIEvent,
  AGUIEventType
};