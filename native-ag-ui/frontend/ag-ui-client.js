/**
 * AG-UI 客户端实现
 * 提供WebSocket通信和AG-UI协议处理功能
 */

class AGUIClient {
    constructor(options = {}) {
        this.options = {
            host: options.host || 'localhost',
            port: options.port || 8000,
            autoReconnect: options.autoReconnect !== false,
            reconnectInterval: options.reconnectInterval || 3000,
            maxReconnectAttempts: options.maxReconnectAttempts || 5,
            ...options
        };
        
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        
        // 事件处理器
        this.eventHandlers = new Map();
        this.messageHandlers = new Map();
        
        // 消息队列（用于离线时缓存消息）
        this.messageQueue = [];
        
        // 状态管理
        this.state = {};
        this.messages = [];
        
        // 绑定方法
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.send = this.send.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onEvent = this.onEvent.bind(this);
    }
    
    /**
     * 连接到AG-UI服务器
     */
    async connect() {
        if (this.connected || this.ws) {
            console.warn('AG-UI客户端已连接或正在连接中');
            return;
        }
        
        try {
            const wsUrl = `ws://${this.options.host}:${this.options.port}/ws`;
            console.log(`🔌 连接到AG-UI服务器: ${wsUrl}`);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = this._handleOpen.bind(this);
            this.ws.onmessage = this._handleMessage.bind(this);
            this.ws.onclose = this._handleClose.bind(this);
            this.ws.onerror = this._handleError.bind(this);
            
        } catch (error) {
            console.error('AG-UI连接失败:', error);
            this._triggerEvent('connection_error', { error });
            
            if (this.options.autoReconnect) {
                this._scheduleReconnect();
            }
        }
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        this.options.autoReconnect = false;
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.connected = false;
        this.reconnectAttempts = 0;
        
        console.log('🔌 AG-UI客户端已断开连接');
        this._triggerEvent('disconnected');
    }
    
    /**
     * 发送消息
     */
    send(message) {
        if (!this.connected || !this.ws) {
            console.warn('AG-UI客户端未连接，消息已加入队列');
            this.messageQueue.push(message);
            return false;
        }
        
        try {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            this.ws.send(messageStr);
            return true;
        } catch (error) {
            console.error('发送消息失败:', error);
            return false;
        }
    }
    
    /**
     * 发送用户消息
     */
    sendUserMessage(content) {
        const message = {
            type: 'user_message',
            content: content,
            timestamp: Date.now()
        };
        
        return this.send(message);
    }
    
    /**
     * 发送ping消息
     */
    ping() {
        return this.send({ type: 'ping', timestamp: Date.now() });
    }
    
    /**
     * 获取服务器状态
     */
    getState() {
        return this.send({ type: 'get_state', timestamp: Date.now() });
    }
    
    /**
     * 注册事件处理器
     */
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }
    
    /**
     * 移除事件处理器
     */
    off(eventType, handler) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    /**
     * 注册消息处理器
     */
    onMessage(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        this.messageHandlers.get(messageType).push(handler);
    }
    
    /**
     * 注册AG-UI事件处理器
     */
    onEvent(eventType, handler) {
        this.on(`agui_${eventType}`, handler);
    }
    
    /**
     * 获取连接状态
     */
    isConnected() {
        return this.connected;
    }
    
    /**
     * 获取当前状态
     */
    getCurrentState() {
        return { ...this.state };
    }
    
    /**
     * 获取消息历史
     */
    getMessages() {
        return [...this.messages];
    }
    
    // 私有方法
    
    _handleOpen(event) {
        console.log('✅ AG-UI连接已建立');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // 发送队列中的消息
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
        
        this._triggerEvent('connected', { event });
        
        // 发送ping保持连接
        this._startHeartbeat();
    }
    
    _handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // 处理AG-UI协议事件
            if (this._isAGUIEvent(data)) {
                this._handleAGUIEvent(data);
            }
            
            // 处理普通消息
            const messageType = data.type;
            if (this.messageHandlers.has(messageType)) {
                const handlers = this.messageHandlers.get(messageType);
                handlers.forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        console.error(`消息处理器错误 (${messageType}):`, error);
                    }
                });
            }
            
            // 触发通用消息事件
            this._triggerEvent('message', data);
            
        } catch (error) {
            console.error('解析消息失败:', error, event.data);
        }
    }
    
    _handleClose(event) {
        console.log('🔌 AG-UI连接已关闭:', event.code, event.reason);
        this.connected = false;
        this.ws = null;
        
        this._stopHeartbeat();
        this._triggerEvent('disconnected', { event });
        
        // 自动重连
        if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this._scheduleReconnect();
        }
    }
    
    _handleError(event) {
        console.error('AG-UI连接错误:', event);
        this._triggerEvent('error', { event });
    }
    
    _scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        
        this.reconnectAttempts++;
        const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
        
        console.log(`🔄 ${delay}ms后尝试重连 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
        
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
        
        this._triggerEvent('reconnecting', {
            attempt: this.reconnectAttempts,
            maxAttempts: this.options.maxReconnectAttempts,
            delay
        });
    }
    
    _triggerEvent(eventType, data = {}) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`事件处理器错误 (${eventType}):`, error);
                }
            });
        }
    }
    
    _isAGUIEvent(data) {
        const aguiEventTypes = [
            'TEXT_MESSAGE_START',
            'TEXT_MESSAGE_CONTENT', 
            'TEXT_MESSAGE_END',
            'TEXT_MESSAGE_CHUNK',
            'TOOL_CALL_START',
            'TOOL_CALL_ARGS',
            'TOOL_CALL_END',
            'TOOL_CALL_CHUNK',
            'STATE_SNAPSHOT',
            'STATE_DELTA',
            'MESSAGES_SNAPSHOT',
            'RAW',
            'CUSTOM',
            'RUN_STARTED',
            'RUN_FINISHED',
            'RUN_ERROR',
            'STEP_STARTED',
            'STEP_FINISHED'
        ];
        
        return aguiEventTypes.includes(data.type);
    }
    
    _handleAGUIEvent(event) {
        const eventType = event.type;
        
        // 更新内部状态
        switch (eventType) {
            case 'STATE_SNAPSHOT':
                this.state = { ...event.state };
                break;
                
            case 'STATE_DELTA':
                this.state = { ...this.state, ...event.delta };
                break;
                
            case 'MESSAGES_SNAPSHOT':
                this.messages = [...event.messages];
                break;
                
            case 'TEXT_MESSAGE_START':
                // 开始新消息
                this._startMessage(event);
                break;
                
            case 'TEXT_MESSAGE_CONTENT':
                // 添加消息内容
                this._appendMessageContent(event);
                break;
                
            case 'TEXT_MESSAGE_END':
                // 结束消息
                this._endMessage(event);
                break;
        }
        
        // 触发AG-UI事件
        this._triggerEvent(`agui_${eventType.toLowerCase()}`, event);
        this._triggerEvent('agui_event', event);
        
        // 记录事件日志
        this._logEvent(event);
    }
    
    _startMessage(event) {
        const message = {
            id: event.message_id,
            role: event.role || 'assistant',
            content: '',
            timestamp: event.timestamp || Date.now(),
            streaming: true
        };
        
        // 查找是否已存在该消息
        const existingIndex = this.messages.findIndex(msg => msg.id === message.id);
        if (existingIndex >= 0) {
            this.messages[existingIndex] = message;
        } else {
            this.messages.push(message);
        }
    }
    
    _appendMessageContent(event) {
        const messageIndex = this.messages.findIndex(msg => msg.id === event.message_id);
        if (messageIndex >= 0) {
            this.messages[messageIndex].content += event.content || '';
        }
    }
    
    _endMessage(event) {
        const messageIndex = this.messages.findIndex(msg => msg.id === event.message_id);
        if (messageIndex >= 0) {
            this.messages[messageIndex].streaming = false;
        }
    }
    
    _logEvent(event) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: event.type,
            data: event
        };
        
        this._triggerEvent('event_logged', logEntry);
    }
    
    _startHeartbeat() {
        this._stopHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            if (this.connected) {
                this.ping();
            }
        }, 30000); // 每30秒发送一次ping
    }
    
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.AGUIClient = AGUIClient;
}

// 如果支持模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AGUIClient;
}