import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { GroupPurchaseModule } from './modules/group-purchase/group-purchase.module';
import { SharedEventsModule } from './shared/events/shared-events.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'pinduoduo',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    SharedEventsModule,
    UserModule,
    ProductModule,
    GroupPurchaseModule,
  ],
})
export class AppModule {}
