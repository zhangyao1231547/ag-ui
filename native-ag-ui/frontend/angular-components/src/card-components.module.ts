import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CardComponent } from './card.component';
import { CardRendererComponent } from './card-renderer.component';

/**
 * AG-UI卡片组件模块
 * 提供完整的AG-UI协议支持和卡片渲染功能
 * 可以轻松集成到任何Angular应用中
 */
@NgModule({
  declarations: [
    CardComponent,
    CardRendererComponent
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule
  ],
  exports: [
    CardComponent,
    CardRendererComponent
  ]
})
export class CardComponentsModule { }

/**
 * 导出所有公共接口和类型
 */
export { CardComponent, CardData, CardAction, CardStatus, CardType } from './card.component';
export { CardRendererComponent } from './card-renderer.component';