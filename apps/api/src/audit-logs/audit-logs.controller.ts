import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get all audit logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Audit logs returned successfully' })
  async findAll(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogsService.findAll(query);
    return {
      success: true,
      data: result,
      message: 'Audit logs retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get audit log summary statistics' })
  @ApiResponse({ status: 200, description: 'Audit summary returned successfully' })
  async getSummary() {
    const result = await this.auditLogsService.getSummary();
    return {
      success: true,
      data: result,
      message: 'Audit summary retrieved successfully',
    };
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiResponse({ status: 200, description: 'User activity returned successfully' })
  async findByUser(
    @Param('userId') userId: string,
    @Query() query: AuditLogQueryDto,
  ) {
    const result = await this.auditLogsService.findByUser(userId, query);
    return {
      success: true,
      data: result,
      message: 'User activity retrieved successfully',
    };
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiResponse({ status: 200, description: 'Entity activity returned successfully' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: AuditLogQueryDto,
  ) {
    const result = await this.auditLogsService.findByEntity(entityType, entityId, query);
    return {
      success: true,
      data: result,
      message: 'Entity activity retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get audit log details' })
  @ApiResponse({ status: 200, description: 'Audit log details returned successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.auditLogsService.findOne(id);
    if (!result) {
      return {
        success: false,
        data: null,
        message: 'Audit log not found',
      };
    }
    return {
      success: true,
      data: result,
      message: 'Audit log details retrieved successfully',
    };
  }
}
