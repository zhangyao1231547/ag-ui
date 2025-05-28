import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * 卡片状态枚举
 */
export enum CardStatus {
  PENDING = 'pending',
  EXECUTING = 'executing', 
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * 卡片类型枚举
 */
export enum CardType {
  TASK = 'task',
  TOOL_CALL = 'tool_call',
  MESSAGE = 'message',
  STEP = 'step'
}

/**
 * 卡片数据接口
 */
export interface CardData {
  id: string;
  title: string;
  content: string;
  status: CardStatus;
  type: CardType | string;
  timestamp: string;
  progress: number;
  metadata?: any;
}

/**
 * 卡片操作接口
 */
export interface CardAction {
  action: string;
  cardId: string;
  data?: any;
}

/**
 * AG-UI 卡片组件
 * 基于AG-UI协议实现的Angular卡片组件，支持多种状态和类型
 */
@Component({
  selector: 'app-card',
  template: `
    <div 
      class="card" 
      [ngClass]="[
        'status-' + card.status,
        'type-' + card.type
      ]"
      [@cardAnimation]
    >
      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="card-title">
          <span class="card-icon">{{ getCardIcon() }}</span>
          <h3>{{ card.title }}</h3>
        </div>
        <div class="card-meta">
          <span class="timestamp">{{ card.timestamp }}</span>
          <span class="status-badge" [ngClass]="'status-' + card.status">
            {{ getStatusText() }}
          </span>
        </div>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content">
        <div class="content-text" [innerHTML]="formatContent()"></div>
        
        <!-- 进度条 -->
        <div class="progress-container" *ngIf="card.progress !== undefined">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              [style.width.%]="card.progress"
              [ngClass]="'status-' + card.status"
            ></div>
          </div>
          <span class="progress-text">{{ card.progress }}%</span>
        </div>

        <!-- 元数据显示 -->
        <div class="metadata" *ngIf="card.metadata">
          <details>
            <summary>详细信息</summary>
            <pre>{{ formatMetadata() }}</pre>
          </details>
        </div>
      </div>

      <!-- 卡片操作 -->
      <div class="card-actions">
        <button 
          class="action-btn retry" 
          *ngIf="card.status === 'error'"
          (click)="onAction('retry')"
        >
          🔄 重试
        </button>
        <button 
          class="action-btn cancel" 
          *ngIf="card.status === 'executing'"
          (click)="onAction('cancel')"
        >
          ⏹️ 取消
        </button>
        <button 
          class="action-btn details" 
          (click)="onAction('details')"
        >
          📋 详情
        </button>
        <button 
          class="action-btn remove" 
          (click)="onAction('remove')"
        >
          🗑️ 删除
        </button>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 20px;
      margin-bottom: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-icon {
      font-size: 1.2rem;
    }

    .card-title h3 {
      margin: 0;
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .timestamp {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.status-pending {
      background: rgba(255, 167, 38, 0.2);
      color: #ffa726;
      border: 1px solid rgba(255, 167, 38, 0.3);
    }

    .status-badge.status-executing {
      background: rgba(66, 165, 245, 0.2);
      color: #42a5f5;
      border: 1px solid rgba(66, 165, 245, 0.3);
    }

    .status-badge.status-completed {
      background: rgba(102, 187, 106, 0.2);
      color: #66bb6a;
      border: 1px solid rgba(102, 187, 106, 0.3);
    }

    .status-badge.status-error {
      background: rgba(239, 83, 80, 0.2);
      color: #ef5350;
      border: 1px solid rgba(239, 83, 80, 0.3);
    }

    .card-content {
      margin-bottom: 16px;
    }

    .content-text {
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      margin-bottom: 12px;
      white-space: pre-wrap;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-fill.status-pending {
      background: linear-gradient(90deg, #ffa726, #ffb74d);
    }

    .progress-fill.status-executing {
      background: linear-gradient(90deg, #42a5f5, #64b5f6);
    }

    .progress-fill.status-completed {
      background: linear-gradient(90deg, #66bb6a, #81c784);
    }

    .progress-fill.status-error {
      background: linear-gradient(90deg, #ef5350, #f44336);
    }

    .progress-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
      font-weight: 500;
      min-width: 40px;
    }

    .metadata {
      margin-top: 12px;
    }

    .metadata details {
      color: rgba(255, 255, 255, 0.7);
    }

    .metadata summary {
      cursor: pointer;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .metadata pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      overflow-x: auto;
      margin: 0;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .action-btn.retry {
      border-color: rgba(102, 187, 106, 0.5);
    }

    .action-btn.retry:hover {
      background: rgba(102, 187, 106, 0.2);
    }

    .action-btn.cancel {
      border-color: rgba(239, 83, 80, 0.5);
    }

    .action-btn.cancel:hover {
      background: rgba(239, 83, 80, 0.2);
    }

    .action-btn.remove {
      border-color: rgba(158, 158, 158, 0.5);
    }

    .action-btn.remove:hover {
      background: rgba(158, 158, 158, 0.2);
    }

    /* 状态特定样式 */
    .card.status-pending {
      border-left: 4px solid #ffa726;
    }

    .card.status-executing {
      border-left: 4px solid #42a5f5;
    }

    .card.status-completed {
      border-left: 4px solid #66bb6a;
    }

    .card.status-error {
      border-left: 4px solid #ef5350;
    }

    /* 类型特定样式 */
    .card.type-task {
      background: rgba(103, 58, 183, 0.1);
    }

    .card.type-tool_call {
      background: rgba(255, 152, 0, 0.1);
    }

    .card.type-message {
      background: rgba(33, 150, 243, 0.1);
    }

    .card.type-step {
      background: rgba(76, 175, 80, 0.1);
    }
  `],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-100%)' }))
      ])
    ])
  ]
})
export class CardComponent {
  @Input() card!: CardData;
  @Output() action = new EventEmitter<CardAction>();

  /**
   * 获取卡片图标
   */
  getCardIcon(): string {
    const iconMap: Record<string, string> = {
      'task': '📋',
      'tool_call': '🔧',
      'message': '💬',
      'step': '👣',
      'analysis': '📊',
      'unknown': '❓'
    };
    return iconMap[this.card.type] || iconMap['unknown'];
  }

  /**
   * 获取状态文本
   */
  getStatusText(): string {
    const statusMap: Record<CardStatus, string> = {
      [CardStatus.PENDING]: '等待中',
      [CardStatus.EXECUTING]: '执行中',
      [CardStatus.COMPLETED]: '已完成',
      [CardStatus.ERROR]: '错误'
    };
    return statusMap[this.card.status as CardStatus] || '未知';
  }

  /**
   * 格式化内容
   */
  formatContent(): string {
    if (!this.card.content) return '';
    
    // 简单的Markdown-like格式化
    return this.card.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  /**
   * 格式化元数据
   */
  formatMetadata(): string {
    if (!this.card.metadata) return '';
    return JSON.stringify(this.card.metadata, null, 2);
  }

  /**
   * 处理卡片操作
   */
  onAction(actionType: string): void {
    this.action.emit({
      action: actionType,
      cardId: this.card.id,
      data: this.card
    });
  }
}