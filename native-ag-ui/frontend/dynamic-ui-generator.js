/**
 * 动态UI生成器
 * 根据大模型返回的内容动态生成和渲染前端组件
 */

class DynamicUIGenerator {
    constructor() {
        this.componentRegistry = new Map();
        this.activeComponents = new Map();
        this.initializeDefaultComponents();
    }

    /**
     * 初始化默认组件类型
     */
    initializeDefaultComponents() {
        // 注册内置组件类型
        this.registerComponent('progress_tracker', this.createProgressTracker.bind(this));
        this.registerComponent('data_visualization', this.createDataVisualization.bind(this));
        this.registerComponent('interactive_form', this.createInteractiveForm.bind(this));
        this.registerComponent('code_block', this.createCodeBlock.bind(this));
        this.registerComponent('task_list', this.createTaskList.bind(this));
        this.registerComponent('status_dashboard', this.createStatusDashboard.bind(this));
        this.registerComponent('file_explorer', this.createFileExplorer.bind(this));
        this.registerComponent('chat_bubble', this.createChatBubble.bind(this));
        this.registerComponent('notification_panel', this.createNotificationPanel.bind(this));
        this.registerComponent('media_player', this.createMediaPlayer.bind(this));
    }

    /**
     * 注册新的组件类型
     */
    registerComponent(type, generator) {
        this.componentRegistry.set(type, generator);
    }

    /**
     * 根据内容生成动态UI
     */
    generateUI(content, context = {}) {
        try {
            // 解析内容，识别UI生成指令
            const uiInstructions = this.parseUIInstructions(content);
            
            if (uiInstructions.length === 0) {
                return null; // 没有UI指令，返回null
            }

            const components = [];
            
            for (const instruction of uiInstructions) {
                const component = this.createComponent(instruction, context);
                if (component) {
                    components.push(component);
                }
            }

            return components.length > 0 ? this.wrapComponents(components) : null;
        } catch (error) {
            console.error('动态UI生成失败:', error);
            return null;
        }
    }

    /**
     * 解析UI生成指令
     */
    parseUIInstructions(content) {
        const instructions = [];
        
        // 检测各种UI模式
        const patterns = [
            // 进度追踪模式
            {
                pattern: /(?:进度|progress|完成|执行|处理).*?(\d+)%/gi,
                type: 'progress_tracker'
            },
            // 数据可视化模式
            {
                pattern: /(?:图表|chart|数据|data|统计|分析)/gi,
                type: 'data_visualization'
            },
            // 任务列表模式
            {
                pattern: /(?:任务|task|步骤|step|清单|list)/gi,
                type: 'task_list'
            },
            // 代码块模式
            {
                pattern: /```([\s\S]*?)```/g,
                type: 'code_block'
            },
            // 文件操作模式
            {
                pattern: /(?:文件|file|目录|directory|创建|删除|修改)/gi,
                type: 'file_explorer'
            },
            // 状态仪表板模式
            {
                pattern: /(?:状态|status|监控|monitor|仪表板|dashboard)/gi,
                type: 'status_dashboard'
            }
        ];

        for (const { pattern, type } of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                instructions.push({
                    type,
                    content: matches,
                    originalContent: content
                });
            }
        }

        // 如果没有匹配到特定模式，但内容较长，创建增强的聊天气泡
        if (instructions.length === 0 && content.length > 100) {
            instructions.push({
                type: 'chat_bubble',
                content: [content],
                originalContent: content
            });
        }

        return instructions;
    }

    /**
     * 创建组件
     */
    createComponent(instruction, context) {
        const generator = this.componentRegistry.get(instruction.type);
        if (!generator) {
            console.warn(`未知的组件类型: ${instruction.type}`);
            return null;
        }

        return generator(instruction, context);
    }

    /**
     * 包装组件
     */
    wrapComponents(components) {
        const container = document.createElement('div');
        container.className = 'dynamic-ui-container';
        
        components.forEach(component => {
            if (component) {
                container.appendChild(component);
            }
        });

        return container;
    }

    /**
     * 创建进度追踪器
     */
    createProgressTracker(instruction, context) {
        const container = document.createElement('div');
        container.className = 'progress-tracker-component';
        
        // 提取进度值
        const progressMatch = instruction.originalContent.match(/(\d+)%/);
        const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
        
        container.innerHTML = `
            <div class="progress-header">
                <h4>📊 任务进度</h4>
                <span class="progress-value">${progress}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-description">
                ${instruction.originalContent.replace(/\d+%/, '').trim()}
            </div>
        `;

        return container;
    }

    /**
     * 创建数据可视化组件
     */
    createDataVisualization(instruction, context) {
        const container = document.createElement('div');
        container.className = 'data-viz-component';
        
        // 模拟数据可视化
        const data = this.extractDataFromContent(instruction.originalContent);
        
        container.innerHTML = `
            <div class="viz-header">
                <h4>📈 数据可视化</h4>
            </div>
            <div class="viz-content">
                ${this.generateSimpleChart(data)}
            </div>
            <div class="viz-description">
                ${instruction.originalContent}
            </div>
        `;

        return container;
    }

    /**
     * 创建交互式表单
     */
    createInteractiveForm(instruction, context) {
        const container = document.createElement('div');
        container.className = 'interactive-form-component';
        
        container.innerHTML = `
            <div class="form-header">
                <h4>📝 交互式表单</h4>
            </div>
            <div class="form-content">
                <input type="text" placeholder="请输入内容..." class="form-input">
                <button class="form-submit">提交</button>
            </div>
        `;

        // 绑定事件
        const submitBtn = container.querySelector('.form-submit');
        const input = container.querySelector('.form-input');
        
        submitBtn.addEventListener('click', () => {
            const value = input.value.trim();
            if (value) {
                this.handleFormSubmit(value, context);
                input.value = '';
            }
        });

        return container;
    }

    /**
     * 创建代码块组件
     */
    createCodeBlock(instruction, context) {
        const container = document.createElement('div');
        container.className = 'code-block-component';
        
        const codeContent = instruction.content[0].replace(/```/g, '').trim();
        const language = this.detectLanguage(codeContent);
        
        container.innerHTML = `
            <div class="code-header">
                <h4>💻 代码块</h4>
                <span class="language-tag">${language}</span>
                <button class="copy-btn" onclick="navigator.clipboard.writeText(this.dataset.code)"
                        data-code="${codeContent.replace(/"/g, '&quot;')}">
                    📋 复制
                </button>
            </div>
            <pre class="code-content"><code class="language-${language}">${this.escapeHtml(codeContent)}</code></pre>
        `;

        return container;
    }

    /**
     * 创建任务列表组件
     */
    createTaskList(instruction, context) {
        const container = document.createElement('div');
        container.className = 'task-list-component';
        
        const tasks = this.extractTasksFromContent(instruction.originalContent);
        
        container.innerHTML = `
            <div class="task-header">
                <h4>✅ 任务列表</h4>
                <span class="task-count">${tasks.length} 项任务</span>
            </div>
            <div class="task-content">
                ${tasks.map((task, index) => `
                    <div class="task-item" data-task-id="${index}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // 绑定任务完成事件
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const taskItem = e.target.closest('.task-item');
                const taskText = taskItem.querySelector('.task-text');
                
                if (e.target.checked) {
                    taskText.classList.add('completed');
                } else {
                    taskText.classList.remove('completed');
                }
            }
        });

        return container;
    }

    /**
     * 创建状态仪表板
     */
    createStatusDashboard(instruction, context) {
        const container = document.createElement('div');
        container.className = 'status-dashboard-component';
        
        const metrics = this.extractMetricsFromContent(instruction.originalContent);
        
        container.innerHTML = `
            <div class="dashboard-header">
                <h4>📊 状态仪表板</h4>
                <span class="last-updated">最后更新: ${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="dashboard-content">
                ${metrics.map(metric => `
                    <div class="metric-card">
                        <div class="metric-icon">${metric.icon}</div>
                        <div class="metric-value">${metric.value}</div>
                        <div class="metric-label">${metric.label}</div>
                    </div>
                `).join('')}
            </div>
        `;

        return container;
    }

    /**
     * 创建文件浏览器组件
     */
    createFileExplorer(instruction, context) {
        const container = document.createElement('div');
        container.className = 'file-explorer-component';
        
        const files = this.extractFilesFromContent(instruction.originalContent);
        
        container.innerHTML = `
            <div class="explorer-header">
                <h4>📁 文件浏览器</h4>
            </div>
            <div class="explorer-content">
                ${files.map(file => `
                    <div class="file-item" data-file-path="${file.path}">
                        <span class="file-icon">${file.type === 'directory' ? '📁' : '📄'}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${file.size || ''}</span>
                    </div>
                `).join('')}
            </div>
        `;

        return container;
    }

    /**
     * 创建增强的聊天气泡
     */
    createChatBubble(instruction, context) {
        const container = document.createElement('div');
        container.className = 'enhanced-chat-bubble';
        
        const content = instruction.originalContent;
        const hasLinks = /https?:\/\/[^\s]+/g.test(content);
        const hasEmails = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g.test(content);
        
        container.innerHTML = `
            <div class="bubble-content">
                ${this.enhanceTextContent(content)}
            </div>
            ${hasLinks || hasEmails ? `
                <div class="bubble-actions">
                    ${hasLinks ? '<button class="action-btn" onclick="window.dynamicUIGenerator.extractAndOpenLinks(this)">🔗 打开链接</button>' : ''}
                    ${hasEmails ? '<button class="action-btn" onclick="window.dynamicUIGenerator.extractAndCopyEmails(this)">📧 复制邮箱</button>' : ''}
                </div>
            ` : ''}
        `;

        return container;
    }

    /**
     * 创建通知面板
     */
    createNotificationPanel(instruction, context) {
        const container = document.createElement('div');
        container.className = 'notification-panel-component';
        
        container.innerHTML = `
            <div class="notification-header">
                <h4>🔔 通知中心</h4>
            </div>
            <div class="notification-content">
                <div class="notification-item">
                    <span class="notification-icon">ℹ️</span>
                    <span class="notification-text">${instruction.originalContent}</span>
                    <span class="notification-time">${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        `;

        return container;
    }

    /**
     * 创建媒体播放器
     */
    createMediaPlayer(instruction, context) {
        const container = document.createElement('div');
        container.className = 'media-player-component';
        
        container.innerHTML = `
            <div class="player-header">
                <h4>🎵 媒体播放器</h4>
            </div>
            <div class="player-content">
                <div class="player-controls">
                    <button class="play-btn">▶️</button>
                    <button class="pause-btn">⏸️</button>
                    <button class="stop-btn">⏹️</button>
                </div>
                <div class="player-info">
                    ${instruction.originalContent}
                </div>
            </div>
        `;

        return container;
    }

    // 辅助方法
    extractDataFromContent(content) {
        // 简单的数据提取逻辑
        const numbers = content.match(/\d+/g) || [];
        return numbers.slice(0, 5).map(num => parseInt(num));
    }

    generateSimpleChart(data) {
        if (data.length === 0) return '<div class="no-data">暂无数据</div>';
        
        const max = Math.max(...data);
        return `
            <div class="simple-chart">
                ${data.map((value, index) => `
                    <div class="chart-bar">
                        <div class="bar-fill" style="height: ${(value / max) * 100}%"></div>
                        <div class="bar-label">${value}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    extractTasksFromContent(content) {
        const lines = content.split('\n');
        const tasks = [];
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.match(/^[\d\-\*\+]\s+/) || trimmed.includes('任务') || trimmed.includes('步骤')) {
                tasks.push({
                    text: trimmed.replace(/^[\d\-\*\+]\s+/, ''),
                    completed: trimmed.includes('✓') || trimmed.includes('完成')
                });
            }
        });
        
        return tasks.length > 0 ? tasks : [{ text: content, completed: false }];
    }

    extractMetricsFromContent(content) {
        const defaultMetrics = [
            { icon: '🟢', value: '在线', label: '系统状态' },
            { icon: '⚡', value: '98%', label: '性能' },
            { icon: '📊', value: '1.2K', label: '活跃用户' }
        ];
        
        // 尝试从内容中提取实际指标
        const numbers = content.match(/\d+/g) || [];
        if (numbers.length >= 3) {
            return [
                { icon: '📈', value: numbers[0], label: '指标1' },
                { icon: '📊', value: numbers[1], label: '指标2' },
                { icon: '⚡', value: numbers[2], label: '指标3' }
            ];
        }
        
        return defaultMetrics;
    }

    extractFilesFromContent(content) {
        const lines = content.split('\n');
        const files = [];
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes('.') && (trimmed.includes('/') || trimmed.includes('\\'))) {
                const isDirectory = trimmed.endsWith('/') || trimmed.endsWith('\\');
                files.push({
                    name: trimmed.split(/[\/\\]/).pop(),
                    path: trimmed,
                    type: isDirectory ? 'directory' : 'file',
                    size: isDirectory ? '' : '1.2KB'
                });
            }
        });
        
        return files.length > 0 ? files : [
            { name: 'example.txt', path: '/example.txt', type: 'file', size: '1.2KB' }
        ];
    }

    detectLanguage(code) {
        if (code.includes('function') || code.includes('const') || code.includes('let')) return 'javascript';
        if (code.includes('def ') || code.includes('import ')) return 'python';
        if (code.includes('public class') || code.includes('System.out')) return 'java';
        if (code.includes('#include') || code.includes('int main')) return 'cpp';
        return 'text';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    enhanceTextContent(content) {
        // 增强文本内容：链接、邮箱、高亮等
        return content
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="enhanced-link">$1</a>')
            .replace(/([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="enhanced-email">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
    }

    // 公共方法
    extractAndOpenLinks(button) {
        const content = button.closest('.enhanced-chat-bubble').querySelector('.bubble-content').textContent;
        const links = content.match(/https?:\/\/[^\s]+/g) || [];
        links.forEach(link => window.open(link, '_blank'));
    }

    extractAndCopyEmails(button) {
        const content = button.closest('.enhanced-chat-bubble').querySelector('.bubble-content').textContent;
        const emails = content.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || [];
        if (emails.length > 0) {
            navigator.clipboard.writeText(emails.join(', '));
            showNotification('邮箱地址已复制到剪贴板', 'success');
        }
    }

    handleFormSubmit(value, context) {
        console.log('表单提交:', value, context);
        showNotification(`已提交: ${value}`, 'success');
        
        // 这里可以集成到AG-UI客户端，发送用户输入
        if (window.aguiClient) {
            window.aguiClient.sendMessage(value);
        }
    }

    /**
     * 清理所有活动组件
     */
    clearAllComponents() {
        this.activeComponents.clear();
    }

    /**
     * 获取组件统计信息
     */
    getStats() {
        return {
            registeredTypes: this.componentRegistry.size,
            activeComponents: this.activeComponents.size
        };
    }
}

// 全局实例
window.dynamicUIGenerator = new DynamicUIGenerator();

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicUIGenerator;
}