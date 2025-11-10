import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { MeetingVisibility } from "../zoom.schema";

export class CreateMeetingDto {
  @ApiProperty({ example: "Meeting Topic" })
  @IsString()
  topic: string;

  @ApiProperty({ example: "2023-01-01T10:00:00Z" })
  @IsString()
  startTime: string;

  @ApiProperty({ example: 30 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ example: "public", enum: MeetingVisibility })
  @IsEnum(MeetingVisibility)
  visibility: MeetingVisibility;
}

export class JoinMeetingDto {
  @ApiProperty({ example: "123456789" })
  @IsString()
  meetingId: string;
}
