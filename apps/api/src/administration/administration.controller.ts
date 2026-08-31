import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdministrationService } from './administration.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto/system-settings.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('administration')
export class AdministrationController {
  constructor(private readonly administrationService: AdministrationService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get administration overview statistics' })
  @ApiResponse({ status: 200, description: 'Overview returned successfully' })
  async getOverview() {
    const result = await this.administrationService.getOverview();
    return {
      success: true,
      data: result,
      message: 'Administration overview retrieved successfully',
    };
  }

  @Get('system-info')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get system information' })
  @ApiResponse({ status: 200, description: 'System info returned successfully' })
  async getSystemInfo() {
    const result = await this.administrationService.getSystemInfo();
    return {
      success: true,
      data: result,
      message: 'System information retrieved successfully',
    };
  }

  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health status returned successfully' })
  async getHealth() {
    const result = await this.administrationService.getHealth();
    return {
      success: true,
      data: result,
      message: 'Health status retrieved successfully',
    };
  }

  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Settings returned successfully' })
  async getAllSettings() {
    const result = await this.administrationService.getAllSettings();
    return {
      success: true,
      data: result,
      message: 'Settings retrieved successfully',
    };
  }

  @Get('settings/public')
  @ApiOperation({ summary: 'Get public system settings' })
  @ApiResponse({ status: 200, description: 'Public settings returned successfully' })
  async getPublicSettings() {
    const result = await this.administrationService.getPublicSettings();
    return {
      success: true,
      data: result,
      message: 'Public settings retrieved successfully',
    };
  }

  @Get('settings/:key')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get a system setting by key' })
  @ApiResponse({ status: 200, description: 'Setting returned successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async getSettingByKey(@Param('key') key: string) {
    const result = await this.administrationService.getSettingByKey(key);
    return {
      success: true,
      data: result,
      message: 'Setting retrieved successfully',
    };
  }

  @Post('settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  async createSetting(
    @Body() dto: CreateSystemSettingDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.administrationService.createSetting(dto, user.id);
    return {
      success: true,
      data: result,
      message: 'Setting created successfully',
    };
  }

  @Patch('settings/:key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.administrationService.updateSetting(key, dto, user.id);
    return {
      success: true,
      data: result,
      message: 'Setting updated successfully',
    };
  }

  @Delete('settings/:key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a system setting' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async deleteSetting(
    @Param('key') key: string,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.administrationService.deleteSetting(key, user.id);
    return {
      success: true,
      data: result,
      message: result.message,
    };
  }
}
