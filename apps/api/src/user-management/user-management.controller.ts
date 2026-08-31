import { Controller, Get, Patch, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UserManagementService } from './user-management.service';
import { UserQueryDto, UpdateUserStatusDto, ResetUserPasswordDto } from './dto/user-management.dto';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user-management')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List users with search, filter, pagination' })
  @ApiResponse({ status: 200, description: 'Users returned successfully' })
  async findAll(@Query() query: UserQueryDto) {
    const result = await this.userManagementService.findAll(query);
    return { success: true, data: result, message: 'Users retrieved successfully' };
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'User details returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.userManagementService.findById(id);
    return { success: true, data: result, message: 'User details retrieved' };
  }

  @Patch('users/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user account status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.userManagementService.updateStatus(id, dto, user.id);
    return { success: true, data: result, message: 'Account status updated' };
  }

  @Patch('users/:id/reset-password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.userManagementService.resetPassword(id, dto, user.id);
    return { success: true, data: result, message: result.message };
  }

  @Get('users/:id/activity')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user activity' })
  @ApiResponse({ status: 200, description: 'User activity returned' })
  async getUserActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    const result = await this.userManagementService.getUserActivity(id, query);
    return { success: true, data: result, message: 'User activity retrieved' };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user management summary' })
  @ApiResponse({ status: 200, description: 'Summary returned' })
  async getSummary() {
    const result = await this.userManagementService.getSummary();
    return { success: true, data: result, message: 'Summary retrieved' };
  }

  @Get('security-summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security summary' })
  @ApiResponse({ status: 200, description: 'Security summary returned' })
  async getSecuritySummary() {
    const result = await this.userManagementService.getSecuritySummary();
    return { success: true, data: result, message: 'Security summary retrieved' };
  }
}
