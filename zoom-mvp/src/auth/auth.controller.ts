import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { AuthGuard } from './guards/authGuard.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a regular user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  registerUser(@Body() dto: RegisterDto) {
    return this.authService.registerUser(dto);
  }

  @Post('admin/register')
  @ApiOperation({ summary: 'Register an admin user' })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  registerAdmin(@Body() dto: RegisterDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login (user or admin)' })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
