import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { CardComponentsModule } from './card-components.module';

/**
 * AG-UI Angular 应用主模块
 * 配置应用的依赖、组件和服务
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, // 支持Angular动画
    CardComponentsModule     // AG-UI卡片组件模块
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }