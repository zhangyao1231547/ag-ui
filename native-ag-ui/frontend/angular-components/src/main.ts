import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

/**
 * AG-UI Angular组件应用启动文件
 * 在native-ag-ui项目中启动Angular组件演示
 */
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error('Angular应用启动失败:', err));