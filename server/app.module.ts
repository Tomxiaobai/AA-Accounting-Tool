import { APP_FILTER } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { MockUserMiddleware } from './common/middleware/mock-user.middleware';
import { ViewModule } from './modules/view/view.module';
import { BillModule } from './modules/bill/bill.module';
import { BillController } from './modules/bill/bill.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BillModule,
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MockUserMiddleware).forRoutes(BillController);
  }
}
