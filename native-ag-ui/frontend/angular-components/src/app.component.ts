import { Component } from '@angular/core';

/**
 * AG-UI Angular组件演示应用
 * 展示如何在native-ag-ui项目中集成Angular卡片组件
 */
@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-card-renderer></app-card-renderer>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100%;
      height: 100vh;
      margin: 0;
      padding: 0;
    }
  `]
})
export class AppComponent {
  title = 'AG-UI Angular Card Components';
}