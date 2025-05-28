import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card.component';
import { CardRendererComponent } from './card-renderer.component';

/**
 * AG-UI卡片组件模块
 * 提供AG-UI协议的Angular实现组件
 */
@NgModule({
  declarations: [
    CardComponent,
    CardRendererComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CardComponent,
    CardRendererComponent
  ]
})
export class CardComponentsModule { }