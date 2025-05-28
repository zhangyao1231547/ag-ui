import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

/**
 * AG-UI Angular 应用启动文件
 * 引导应用启动并处理启动错误
 */
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => {
    console.log('🎉 AG-UI Angular 应用启动成功!');
  })
  .catch(err => {
    console.error('❌ 应用启动失败:', err);
  });