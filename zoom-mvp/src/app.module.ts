import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ZoomModule } from './zoom/zoom.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/zoom-mvp'),
    AuthModule,
    ZoomModule,
  ],
})
export class AppModule {}

