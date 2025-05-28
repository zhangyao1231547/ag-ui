import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * 卡片状态枚举
 */
export enum CardStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

/**
 * 卡片类型枚举
 */
export enum CardType {
  TASK = 'task',
  TOOL_CALL = 'tool_call',
  MESSAGE = 'message',
  STEP = 'step',
  ANALYSIS = 'analysis',
  REPORT = 'report'
}

/**
 * 卡片数据接口
 */
export interface CardData {
  id: string;
  title: string;
  content: string;
  status: CardStatus | string;
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
}

/**
 * 卡片组件
 * 用于显示任务、工具调用、消息等卡片
 */
@Component({
  selector: 'app-card',
  template: `
    <div class="card" [ngClass]="card.status" [@cardAnimation]>
      <div class="card-header">
        <div class="card-title">{{ card.title }}</div>
        <div class="card-status" [ngClass]="card.status">{{ card.status }}</div>
      </div>
      <div class="card-content">{{ card.content }}</div>
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="card.progress"></div>
      </div>
      <div class="card-meta">
        <span>类型: {{ card.type }}</span>
        <span>{{ card.timestamp }}</span>
      </div>
      <div *ngIf="card.status === 'completed'" class="card-actions">
        <button (click)="onAction('view_details')" class="btn-action primary">
          查看详情
        </button>
        <button (click)="onAction('retry')" class="btn-action">
          重试
        </button>
      </div>
    </div>
  `,
  styles: [`
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
  `],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('500ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('500ms ease', style({ opacity: 0, transform: 'translateY(-30px)' }))
      ])
    ])
  ]
})
export class CardComponent implements OnInit {
  @Input() card!: CardData;
  @Output() action = new EventEmitter<CardAction>();

  constructor() {}

  ngOnInit(): void {}

  onAction(actionType: string): void {
    this.action.emit({
      action: actionType,
      cardId: this.card.id
    });
  }
}