import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ZoomDocument = Zoom & Document;

export enum MeetingVisibility {
  STAFF = 'staff',
  PUBLIC = 'public',
  USERS = 'users',
}
@Schema({ timestamps: true })
export class Zoom {
  @Prop({ required: true })
  meetingId: string;

  @Prop({ required: true })
  topic: string;
  
  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  joinUrl: string;

  @Prop({ required: true })
  hostId: string;

  @Prop({ required: true, enum: MeetingVisibility })
  visibility: MeetingVisibility;
}

export const ZoomSchema = SchemaFactory.createForClass(Zoom);