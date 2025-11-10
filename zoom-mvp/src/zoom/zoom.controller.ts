import { Controller, Post, Body, UseGuards, Get, Param, Request, Req, Query, Headers, BadRequestException } from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { AuthGuard } from '../auth/guards/authGuard.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateMeetingDto, JoinMeetingDto } from './dto/zoom.dto';

@ApiTags('Zoom')
@ApiBearerAuth()
@Controller('zoom')
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) { }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('create-meeting')
  async createMeeting(
    @Body() body: CreateMeetingDto,
    @Req() req,
  ) {
    const hostId = req.user.id;
    return this.zoomService.createMeeting(body.topic, body.startTime, body.duration, body.visibility, hostId);
  }

  @Get('join-meeting/:id')
  async joinMeeting(
    @Param('id') meetingId: string
  ) {
    console.log('Joining meeting with ID:', meetingId);
    return this.zoomService.joinMeeting(meetingId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get('meetings')
  async getAllMeetings(@Req() req) {
    const userRole = req.user.role;
    return this.zoomService.getAllMeetings(userRole);
  }

  @Get('signature')
  @UseGuards(AuthGuard)
  getSignature(
    @Query('meetingNumber') meetingNumber: string,
    @Query('role') role: string,
    @Headers('authorization') auth: string,
  ) {
    if (!meetingNumber) throw new BadRequestException('meetingNumber is required');
    const signature = this.zoomService.generateSignature(meetingNumber, Number(role) as 0 | 1);
    return { signature };
  }
  
}
