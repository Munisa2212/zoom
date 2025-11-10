import { Module } from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { ZoomController } from './zoom.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Zoom, ZoomSchema } from './zoom.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: Zoom.name, schema: ZoomSchema }]),
  ],
  controllers: [ZoomController],
  providers: [ZoomService],
})
export class ZoomModule {}
