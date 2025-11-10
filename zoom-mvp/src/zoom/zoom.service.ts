import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { MeetingVisibility, Zoom, ZoomDocument } from './zoom.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class ZoomService {
  private accountId = process.env.ZOOM_ACCOUNT_ID;
  private clientId = process.env.ZOOM_CLIENT_ID;
  private clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  private sdkKey = process.env.SDK_KEY!;
  private sdkSecret = process.env.SDK_SECRET!;

  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(
    @InjectModel(Zoom.name) private zoomModel: Model<ZoomDocument>,
    private jwtService: JwtService,
  ) { }
  async getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`;
    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const res = await axios.post(url, {}, {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      this.accessToken = res.data.access_token;
      this.tokenExpiresAt = now + res.data.expires_in - 60;

      return this.accessToken;
    } catch (error) {
      console.error('Zoom OAuth error:', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to get Zoom access token');
    }
  }

  async createMeeting(topic: string, startTime: string, duration = 30, visibility: MeetingVisibility, hostId: string) {
    const token = await this.getAccessToken();

    const body = {
      topic,
      type: 2,
      start_time: startTime,
      duration,
      timezone: 'UTC',
      settings: {
        "host_video": true,
        "participant_video": true,
        "join_before_host": true,
        "mute_upon_entry": true,
        "approval_type": 0,
        "waiting_room": true,
        "auto_recording": "local"
      },
    };

    const res = await axios.post(
      `https://api.zoom.us/v2/users/me/meetings`,
      body,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    await this.zoomModel.create({
      meetingId: res.data.id,
      topic: res.data.topic,
      startTime: new Date(res.data.start_time),
      duration: res.data.duration,
      joinUrl: res.data.join_url,
      visibility,
      hostId,
    });

    return res.data;
  }

  async joinMeeting(meetingId: string) {
    try {
      const token = await this.getAccessToken();

      const res = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const meetingData = res.data;

      const joinUrl = `https://zoom.us/j/${meetingId}${meetingData.password ? `?pwd=${meetingData.password}` : ''}`;

      return {
        ...meetingData,
        join_url: joinUrl,
      };
    } catch (error) {
      console.error('Error joining Zoom meeting:', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to join Zoom meeting');
    }
  }

  async getAllMeetings(userRole: string) {
    if (userRole !== 'admin') {
      return this.zoomModel.find({ visibility: MeetingVisibility.PUBLIC }).exec();
    }
    return this.zoomModel.find().exec();
  }
  generateSignature(meetingNumber: string, role: 0 | 1) {
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; 

    const oHeader = { alg: 'HS256', typ: 'JWT' };
    const oPayload = {
      appKey: this.sdkKey, // Use SDK_KEY for Meeting SDK
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      tokenExp: exp,
    };

    function base64url(source: Buffer) {
      // Encode in classical base64
      let encoded = source.toString('base64');
      // Remove padding, replace characters
      return encoded.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    const sHeader = base64url(Buffer.from(JSON.stringify(oHeader)));
    const sPayload = base64url(Buffer.from(JSON.stringify(oPayload)));
    const data = `${sHeader}.${sPayload}`;
    const signature = crypto
      .createHmac('sha256', this.sdkSecret) // Use SDK_SECRET for Meeting SDK
      .update(data)
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const MEETING_SDK_JWT = `${data}.${signature}`;
    return MEETING_SDK_JWT;
  }
}