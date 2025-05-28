import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { CardComponentsModule } from './card-components.module';

/**
 * AG-UI Angular应用主模块
 * 集成到native-ag-ui项目中的Angular组件演示
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CardComponentsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }