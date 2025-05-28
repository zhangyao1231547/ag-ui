import { Component } from '@angular/core';

/**
 * AG-UI Angular 应用主组件
 * 展示如何在Angular应用中集成和使用AG-UI卡片组件
 */
@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <!-- 应用头部 -->
      <header class="app-header">
        <div class="container">
          <h1>🚀 AG-UI Angular 示例应用</h1>
          <p>基于AG-UI协议的Angular动态卡片渲染系统</p>
        </div>
      </header>

      <!-- 主要内容区域 -->
      <main class="app-main">
        <div class="container">
          <!-- 功能介绍 -->
          <section class="intro">
            <h2>功能特点</h2>
            <div class="features">
              <div class="feature">
                <h3>🎯 协议支持</h3>
                <p>完整支持AG-UI协议的所有事件类型，包括状态管理、工具调用和消息流</p>
              </div>
              <div class="feature">
                <h3>⚡ 响应式</h3>
                <p>基于Angular的响应式架构，实时更新UI状态和卡片内容</p>
              </div>
              <div class="feature">
                <h3>🎨 美观设计</h3>
                <p>现代化的UI设计，包括玻璃态效果、渐变背景和流畅动画</p>
              </div>
              <div class="feature">
                <h3>🔧 模拟测试</h3>
                <p>内置模拟功能，可以测试各种任务流程和状态更新场景</p>
              </div>
            </div>
          </section>

          <!-- 卡片渲染器 -->
          <section class="renderer-section">
            <app-card-renderer></app-card-renderer>
          </section>

          <!-- 使用说明 -->
          <section class="usage">
            <h2>使用说明</h2>
            <div class="instructions">
              <div class="instruction">
                <h3>1. 连接服务器</h3>
                <p>点击"连接服务器"按钮建立WebSocket连接，开始接收AG-UI协议事件</p>
              </div>
              <div class="instruction">
                <h3>2. 模拟任务</h3>
                <p>使用"模拟任务流程"按钮测试完整的任务执行流程，观察卡片状态变化</p>
              </div>
              <div class="instruction">
                <h3>3. 状态更新</h3>
                <p>使用"模拟状态更新"按钮测试状态快照和增量更新功能</p>
              </div>
              <div class="instruction">
                <h3>4. 查看日志</h3>
                <p>在底部日志面板中查看所有事件的详细信息和处理过程</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- 应用底部 -->
      <footer class="app-footer">
        <div class="container">
          <p>&copy; 2024 AG-UI Angular 示例 - 展示现代化的动态UI渲染技术</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .app-header {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 30px 0;
      text-align: center;
      color: white;
    }

    .app-header h1 {
      font-size: 3rem;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .app-header p {
      font-size: 1.2rem;
      opacity: 0.9;
      margin: 0;
    }

    .app-main {
      padding: 40px 0;
    }

    .intro {
      margin-bottom: 40px;
      text-align: center;
    }

    .intro h2 {
      color: white;
      font-size: 2.5rem;
      margin-bottom: 30px;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .feature {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .feature:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .feature h3 {
      font-size: 1.3rem;
      margin-bottom: 15px;
      color: #fff;
    }

    .feature p {
      opacity: 0.9;
      line-height: 1.6;
      margin: 0;
    }

    .renderer-section {
      margin: 40px 0;
    }

    .usage {
      margin-top: 40px;
      text-align: center;
    }

    .usage h2 {
      color: white;
      font-size: 2.5rem;
      margin-bottom: 30px;
    }

    .instructions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .instruction {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      text-align: left;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .instruction h3 {
      font-size: 1.2rem;
      margin-bottom: 15px;
      color: #fff;
    }

    .instruction p {
      opacity: 0.9;
      line-height: 1.6;
      margin: 0;
    }

    .app-footer {
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 20px 0;
      text-align: center;
      color: white;
      margin-top: 40px;
    }

    .app-footer p {
      margin: 0;
      opacity: 0.8;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .app-header h1 {
        font-size: 2rem;
      }

      .app-header p {
        font-size: 1rem;
      }

      .intro h2,
      .usage h2 {
        font-size: 2rem;
      }

      .features,
      .instructions {
        grid-template-columns: 1fr;
      }

      .container {
        padding: 0 15px;
      }
    }
  `]
})
export class AppComponent {
  title = 'ag-ui-angular-example';

  constructor() {
    console.log('🚀 AG-UI Angular 应用已启动');
  }
}