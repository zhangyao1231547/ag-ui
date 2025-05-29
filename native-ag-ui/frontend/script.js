/**
 * AG-UI 前端主要脚本
 * 处理用户界面交互和AG-UI客户端集成
 */

// 全局变量
let aguiClient = null;
let currentTheme = 'light';
let messageIdCounter = 0;
let isTyping = false;

// DOM元素引用
const elements = {
    connectionStatus: null,
    statusText: null,
    themeToggle: null,
    messagesContainer: null,
    messageInput: null,
    sendButton: null,
    charCount: null,
    clearChat: null,
    exportChat: null,
    eventPanel: null,
    eventLog: null,
    clearEvents: null,
    togglePanel: null
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AG-UI前端应用启动');
    
    // 获取DOM元素
    initializeElements();
    
    // 初始化主题
    initializeTheme();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化AG-UI客户端
    initializeAGUIClient();
    
    // 自动调整输入框高度
    autoResizeTextarea();
    
    console.log('✅ AG-UI前端应用初始化完成');
});

/**
 * 获取DOM元素引用
 */
function initializeElements() {
    elements.connectionStatus = document.getElementById('connectionStatus');
    elements.statusText = document.getElementById('statusText');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.messagesContainer = document.getElementById('messagesContainer');
    elements.messageInput = document.getElementById('messageInput');
    elements.sendButton = document.getElementById('sendButton');
    elements.charCount = document.querySelector('.char-count');
    elements.clearChat = document.getElementById('clearChat');
    elements.exportChat = document.getElementById('exportChat');
    elements.eventPanel = document.getElementById('eventPanel');
    elements.eventLog = document.getElementById('eventLog');
    elements.clearEvents = document.getElementById('clearEvents');
    elements.togglePanel = document.getElementById('togglePanel');
}

/**
 * 初始化主题
 */
function initializeTheme() {
    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('ag-ui-theme');
    if (savedTheme) {
        currentTheme = savedTheme;
    } else {
        // 检测系统主题偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = 'dark';
        }
    }
    
    applyTheme(currentTheme);
}

/**
 * 应用主题
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ag-ui-theme', theme);
    currentTheme = theme;
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 主题切换
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    // 消息输入
    elements.messageInput?.addEventListener('input', handleInputChange);
    elements.messageInput?.addEventListener('keydown', handleKeyDown);
    
    // 发送按钮
    elements.sendButton?.addEventListener('click', sendMessage);
    
    // 聊天操作
    elements.clearChat?.addEventListener('click', clearChat);
    elements.exportChat?.addEventListener('click', exportChat);
    
    // 事件面板
    elements.clearEvents?.addEventListener('click', clearEventLog);
    elements.togglePanel?.addEventListener('click', toggleEventPanel);
    
    // 窗口大小变化
    window.addEventListener('resize', handleResize);
}

/**
 * 初始化AG-UI客户端
 */
function initializeAGUIClient() {
    aguiClient = new AGUIClient({
        host: 'localhost',
        port: 8000,
        autoReconnect: true,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5
    });
    
    // 注册事件处理器
    aguiClient.on('connected', handleConnected);
    aguiClient.on('disconnected', handleDisconnected);
    aguiClient.on('reconnecting', handleReconnecting);
    aguiClient.on('error', handleConnectionError);
    aguiClient.on('event_logged', handleEventLogged);
    
    // 注册AG-UI事件处理器
    aguiClient.onEvent('text_message_start', handleTextMessageStart);
    aguiClient.onEvent('text_message_content', handleTextMessageContent);
    aguiClient.onEvent('text_message_end', handleTextMessageEnd);
    aguiClient.onEvent('tool_call_start', handleToolCallStart);
    aguiClient.onEvent('tool_call_end', handleToolCallEnd);
    aguiClient.onEvent('state_snapshot', handleStateSnapshot);
    aguiClient.onEvent('state_delta', handleStateDelta);
    aguiClient.onEvent('custom', handleCustomEvent);
    
    // 注册消息处理器
    aguiClient.onMessage('pong', handlePong);
    
    // 连接到服务器
    aguiClient.connect();
}

/**
 * 主题切换
 */
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

/**
 * 处理输入变化
 */
function handleInputChange(event) {
    const input = event.target;
    const length = input.value.length;
    const maxLength = input.getAttribute('maxlength') || 1000;
    
    // 更新字符计数
    if (elements.charCount) {
        elements.charCount.textContent = `${length}/${maxLength}`;
    }
    
    // 更新发送按钮状态
    updateSendButtonState();
    
    // 自动调整高度
    autoResizeTextarea();
}

/**
 * 处理键盘事件
 */
function handleKeyDown(event) {
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            // Shift+Enter: 换行
            return;
        } else {
            // Enter: 发送消息
            event.preventDefault();
            sendMessage();
        }
    }
}

/**
 * 更新发送按钮状态
 */
function updateSendButtonState() {
    const hasContent = elements.messageInput?.value.trim().length > 0;
    const isConnected = aguiClient?.isConnected();
    
    if (elements.sendButton) {
        elements.sendButton.disabled = !hasContent || !isConnected || isTyping;
    }
}

/**
 * 自动调整输入框高度
 */
function autoResizeTextarea() {
    if (!elements.messageInput) return;
    
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
}

/**
 * 发送消息
 */
function sendMessage() {
    const content = elements.messageInput?.value.trim();
    if (!content || !aguiClient?.isConnected()) {
        return;
    }
    
    // 显示用户消息
    addMessage({
        id: `user_${++messageIdCounter}_${Date.now()}`,
        role: 'user',
        content: content,
        timestamp: Date.now()
    });
    
    // 发送到服务器
    aguiClient.sendUserMessage(content);
    
    // 清空输入框
    elements.messageInput.value = '';
    handleInputChange({ target: elements.messageInput });
    
    // 显示打字指示器
    showTypingIndicator();
}

/**
 * 快速发送消息
 */
function sendQuickMessage(content) {
    if (!aguiClient?.isConnected()) {
        showNotification('未连接到服务器', 'error');
        return;
    }
    
    elements.messageInput.value = content;
    sendMessage();
}

/**
 * 获取状态
 */
function getState() {
    if (!aguiClient?.isConnected()) {
        showNotification('未连接到服务器', 'error');
        return;
    }
    
    aguiClient.getState();
    showNotification('已请求服务器状态', 'info');
}

/**
 * 添加消息到聊天界面
 */
function addMessage(message) {
    if (!elements.messagesContainer) return;
    
    // 移除欢迎消息
    const welcomeMessage = elements.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // 创建消息元素
    const messageElement = createMessageElement(message);
    
    // 尝试生成动态UI组件
    if (message.role === 'assistant' && message.content && window.dynamicUIGenerator) {
        const dynamicUI = window.dynamicUIGenerator.generateUI(message.content, {
            messageId: message.id,
            role: message.role,
            timestamp: message.timestamp
        });
        
        if (dynamicUI) {
            // 创建动态UI容器
            const dynamicUIContainer = document.createElement('div');
            dynamicUIContainer.className = 'message-dynamic-ui';
            dynamicUIContainer.appendChild(dynamicUI);
            messageElement.appendChild(dynamicUIContainer);
        }
    }
    
    elements.messagesContainer.appendChild(messageElement);
    
    // 滚动到底部
    scrollToBottom();
}

/**
 * 创建消息元素
 */
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    messageDiv.setAttribute('data-message-id', message.id);
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = message.role === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message.content;
    
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    
    const time = new Date(message.timestamp).toLocaleTimeString();
    meta.innerHTML = `
        <span class="message-time">${time}</span>
        ${message.streaming ? '<span class="streaming-indicator">●</span>' : ''}
    `;
    
    contentDiv.appendChild(bubble);
    contentDiv.appendChild(meta);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

/**
 * 显示打字指示器
 */
function showTypingIndicator() {
    if (isTyping) return;
    
    isTyping = true;
    updateSendButtonState();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing';
    typingDiv.setAttribute('data-typing', 'true');
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    contentDiv.appendChild(indicator);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(contentDiv);
    
    elements.messagesContainer?.appendChild(typingDiv);
    scrollToBottom();
}

/**
 * 隐藏打字指示器
 */
function hideTypingIndicator() {
    const typingElement = elements.messagesContainer?.querySelector('[data-typing="true"]');
    if (typingElement) {
        typingElement.remove();
    }
    
    isTyping = false;
    updateSendButtonState();
}

/**
 * 更新消息内容
 */
function updateMessageContent(messageId, content, append = false) {
    const messageElement = elements.messagesContainer?.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const bubble = messageElement.querySelector('.message-bubble');
    if (bubble) {
        let updatedContent;
        if (append) {
            bubble.textContent += content;
            updatedContent = bubble.textContent;
        } else {
            bubble.textContent = content;
            updatedContent = content;
        }
        
        // 检查是否需要更新动态UI
        if (updatedContent && window.dynamicUIGenerator) {
            const existingDynamicUI = messageElement.querySelector('.message-dynamic-ui');
            const newDynamicUI = window.dynamicUIGenerator.generateUI(updatedContent, {
                messageId: messageId,
                role: 'assistant',
                timestamp: Date.now()
            });
            
            if (newDynamicUI) {
                if (existingDynamicUI) {
                    // 更新现有的动态UI
                    existingDynamicUI.innerHTML = '';
                    existingDynamicUI.appendChild(newDynamicUI);
                } else {
                    // 创建新的动态UI容器
                    const dynamicUIContainer = document.createElement('div');
                    dynamicUIContainer.className = 'message-dynamic-ui';
                    dynamicUIContainer.appendChild(newDynamicUI);
                    messageElement.appendChild(dynamicUIContainer);
                }
            }
        }
    }
    
    scrollToBottom();
}

/**
 * 滚动到底部
 */
function scrollToBottom() {
    if (elements.messagesContainer) {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }
}

/**
 * 清空聊天
 */
function clearChat() {
    if (!elements.messagesContainer) return;
    
    // 确认对话框
    if (!confirm('确定要清空聊天记录吗？')) {
        return;
    }
    
    // 清空消息容器
    elements.messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">🤖</div>
            <h3>聊天记录已清空</h3>
            <p>开始新的对话吧！体验全新的动态UI生成功能！</p>
        </div>
    `;
    
    // 重置消息计数器
    messageIdCounter = 0;
    
    // 清空React卡片
    if (window.reactCardRenderer) {
        window.reactCardRenderer.clearCards();
    }
    
    // 清空活动卡片映射
    if (window.activeCards) {
        window.activeCards.clear();
    }
    
    // 清空动态UI生成器
    if (window.dynamicUIGenerator) {
        window.dynamicUIGenerator.clearAllComponents();
    }
    
    showNotification('聊天记录已清空', 'success');
}

/**
 * 导出聊天记录
 */
function exportChat() {
    const messages = aguiClient?.getMessages() || [];
    
    if (messages.length === 0) {
        showNotification('没有聊天记录可导出', 'warning');
        return;
    }
    
    // 生成导出内容
    const exportData = {
        timestamp: new Date().toISOString(),
        messages: messages,
        metadata: {
            version: '1.0',
            client: 'AG-UI Native Implementation'
        }
    };
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ag-ui-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('聊天记录已导出', 'success');
}

/**
 * 清空事件日志
 */
function clearEventLog() {
    if (!elements.eventLog) return;
    
    elements.eventLog.innerHTML = `
        <div class="log-placeholder">
            <span>等待AG-UI事件...</span>
        </div>
    `;
    
    showNotification('事件日志已清空', 'success');
}

/**
 * 切换事件面板
 */
function toggleEventPanel() {
    if (!elements.eventPanel) return;
    
    elements.eventPanel.classList.toggle('collapsed');
    
    const icon = elements.togglePanel?.querySelector('svg polyline');
    if (icon) {
        const isCollapsed = elements.eventPanel.classList.contains('collapsed');
        icon.setAttribute('points', isCollapsed ? '6,9 12,15 18,9' : '18,15 12,9 6,15');
    }
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
    // 重新调整输入框高度
    autoResizeTextarea();
    
    // 滚动到底部
    scrollToBottom();
}

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // 设置背景色
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// AG-UI事件处理器

/**
 * 处理连接成功
 */
function handleConnected(data) {
    console.log('✅ AG-UI连接成功');
    updateConnectionStatus('connected', '已连接');
    showNotification('已连接到AG-UI服务器', 'success');
}

/**
 * 处理连接断开
 */
function handleDisconnected(data) {
    console.log('🔌 AG-UI连接断开');
    updateConnectionStatus('disconnected', '已断开');
    hideTypingIndicator();
    showNotification('与服务器的连接已断开', 'warning');
}

/**
 * 处理重连中
 */
function handleReconnecting(data) {
    console.log(`🔄 AG-UI重连中 (${data.attempt}/${data.maxAttempts})`);
    updateConnectionStatus('connecting', '重连中...');
}

/**
 * 处理连接错误
 */
function handleConnectionError(data) {
    console.error('❌ AG-UI连接错误:', data.error);
    updateConnectionStatus('disconnected', '连接失败');
    showNotification('连接服务器失败', 'error');
}

/**
 * 处理文本消息开始
 */
function handleTextMessageStart(event) {
    console.log('📝 文本消息开始:', event);
    hideTypingIndicator();
    
    // 记录消息信息，但不立即创建DOM元素
    // 等到收到第一个内容块时再创建，避免显示空消息
    window.pendingMessage = {
        id: event.message_id,
        role: event.role || 'assistant',
        content: '',
        timestamp: event.timestamp || Date.now(),
        streaming: true
    };
    
    // 创建React卡片显示消息生成状态
    if (window.reactCardRenderer) {
        const cardId = window.reactCardRenderer.addCard('TEXT_MESSAGE_START', {
            description: '正在生成AI回复...',
            messageId: event.message_id,
            role: event.role || 'assistant'
        });
        
        // 存储卡片ID以便后续更新
        if (!window.activeCards) window.activeCards = new Map();
        window.activeCards.set(`message_${event.message_id}`, cardId);
    }
}

/**
 * 处理文本消息内容
 */
function handleTextMessageContent(event) {
    console.log('📝 文本消息内容:', event);
    
    // 检查是否有待处理的消息（第一个内容块）
    if (window.pendingMessage && window.pendingMessage.id === event.message_id) {
        // 第一个内容块，创建消息元素
        window.pendingMessage.content = event.content || '';
        addMessage(window.pendingMessage);
        window.pendingMessage = null; // 清除待处理消息
    } else {
        // 后续内容块，追加到现有消息
        updateMessageContent(event.message_id, event.content || '', true);
    }
    
    // 更新React卡片进度
    if (window.reactCardRenderer && window.activeCards) {
        const cardId = window.activeCards.get(`message_${event.message_id}`);
        if (cardId) {
            // 模拟进度更新
            const currentProgress = Math.min(90, Math.random() * 30 + 30);
            window.reactCardRenderer.updateCard(cardId, {
                progress: currentProgress,
                title: '📝 内容正在流式输出...',
                description: `正在生成回复内容... (${Math.round(currentProgress)}%)`
            });
        }
    }
}

/**
 * 处理文本消息结束
 */
function handleTextMessageEnd(event) {
    console.log('📝 文本消息结束:', event);
    
    // 处理边界情况：如果消息结束时还有待处理的消息（没有收到任何内容块）
    if (window.pendingMessage && window.pendingMessage.id === event.message_id) {
        // 创建空消息（虽然不理想，但保持消息完整性）
        window.pendingMessage.content = '(无内容)';
        addMessage(window.pendingMessage);
        window.pendingMessage = null;
    }
    
    // 移除流式指示器
    const messageElement = elements.messagesContainer?.querySelector(`[data-message-id="${event.message_id}"]`);
    if (messageElement) {
        const streamingIndicator = messageElement.querySelector('.streaming-indicator');
        if (streamingIndicator) {
            streamingIndicator.remove();
        }
    }
    
    // 完成React卡片状态更新
    if (window.reactCardRenderer && window.activeCards) {
        const cardId = window.activeCards.get(`message_${event.message_id}`);
        if (cardId) {
            window.reactCardRenderer.updateCard(cardId, {
                status: 'completed',
                progress: 100,
                title: '✅ AI回复生成完成',
                description: '消息已成功生成并显示在对话中'
            });
            
            // 3秒后自动清理完成的消息卡片
            setTimeout(() => {
                if (window.activeCards && window.activeCards.has(`message_${event.message_id}`)) {
                    window.activeCards.delete(`message_${event.message_id}`);
                }
            }, 3000);
        }
    }
}

/**
 * 处理工具调用开始
 */
function handleToolCallStart(event) {
    console.log('🔧 工具调用开始:', event);
    
    // 显示工具调用通知
    const toolName = event.tool_name || '未知工具';
    showNotification(`开始调用工具: ${toolName}`, 'info');
    
    // 创建React卡片
    if (window.reactCardRenderer) {
        const cardId = window.reactCardRenderer.addCard('TOOL_CALL_START', {
            description: `正在调用工具: ${toolName}`,
            toolName: toolName,
            ...event
        });
        
        // 存储卡片ID以便后续更新
        if (!window.activeCards) window.activeCards = new Map();
        window.activeCards.set(`tool_${event.tool_call_id || Date.now()}`, cardId);
    }
}

/**
 * 处理工具调用结束
 */
function handleToolCallEnd(event) {
    console.log('🔧 工具调用结束:', event);
    
    const toolName = event.tool_name || '未知工具';
    const success = event.success !== false; // 默认为成功，除非明确标记为失败
    
    showNotification(`工具调用${success ? '完成' : '失败'}: ${toolName}`, success ? 'success' : 'error');
    
    // 更新React卡片状态
    if (window.reactCardRenderer && window.activeCards) {
        const cardKey = `tool_${event.tool_call_id || Date.now()}`;
        const cardId = window.activeCards.get(cardKey);
        
        if (cardId) {
            window.reactCardRenderer.updateCard(cardId, {
                status: success ? 'completed' : 'error',
                progress: 100,
                title: success ? `✅ ${toolName} 调用完成` : `❌ ${toolName} 调用失败`,
                description: event.result || event.error || `工具 ${toolName} ${success ? '执行成功' : '执行失败'}`
            });
            
            // 清理已完成的卡片引用
            window.activeCards.delete(cardKey);
        }
    }
}

/**
 * 处理状态快照
 */
function handleStateSnapshot(event) {
    console.log('📊 状态快照:', event);
    showNotification('收到状态快照', 'info');
}

/**
 * 处理状态增量
 */
function handleStateDelta(event) {
    console.log('📊 状态增量:', event);
}

/**
 * 处理自定义事件
 */
function handleCustomEvent(event) {
    console.log('🎯 自定义事件:', event);
    
    if (event.data && event.data.message) {
        showNotification(event.data.message, 'info');
    }
}

/**
 * 处理pong消息
 */
function handlePong(data) {
    console.log('🏓 收到pong:', data);
}

/**
 * 处理事件日志
 */
function handleEventLogged(logEntry) {
    addEventLogEntry(logEntry);
}

/**
 * 更新连接状态
 */
function updateConnectionStatus(status, text) {
    if (elements.connectionStatus) {
        const indicator = elements.connectionStatus.querySelector('.status-indicator');
        const statusSpan = elements.connectionStatus.querySelector('span');
        
        if (indicator) {
            indicator.className = `status-indicator ${status}`;
        }
        
        if (statusSpan) {
            statusSpan.textContent = text;
        }
    }
    
    if (elements.statusText) {
        elements.statusText.textContent = text;
    }
    
    updateSendButtonState();
}

/**
 * 添加事件日志条目
 */
function addEventLogEntry(logEntry) {
    if (!elements.eventLog) return;
    
    // 移除占位符
    const placeholder = elements.eventLog.querySelector('.log-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // 创建日志条目
    const logDiv = document.createElement('div');
    logDiv.className = 'event-log-item';
    
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const eventType = logEntry.type;
    const eventData = JSON.stringify(logEntry.data, null, 2);
    
    logDiv.innerHTML = `
        <div class="event-timestamp">${timestamp}</div>
        <span class="event-type">${eventType}</span>
        <div class="event-data">${eventData}</div>
    `;
    
    // 添加到日志容器
    elements.eventLog.appendChild(logDiv);
    
    // 限制日志条目数量
    const logItems = elements.eventLog.querySelectorAll('.event-log-item');
    if (logItems.length > 50) {
        logItems[0].remove();
    }
    
    // 滚动到底部
    elements.eventLog.scrollTop = elements.eventLog.scrollHeight;
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);