import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';
import { ProjectActivitiesService } from './project-activities.service';
import { CreateProjectActivityDto } from './dto/create-project-activity.dto';
import { UpdateProjectActivityDto } from './dto/update-project-activity.dto';
import { UpdateProjectActivityStatusDto } from './dto/update-project-activity-status.dto';
import { UpdateProjectActivityProgressDto } from './dto/update-project-activity-progress.dto';

@ApiTags('Project Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('project-activities')
export class ProjectActivitiesController {
  constructor(
    private readonly activitiesService: ProjectActivitiesService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all project activities with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiQuery({ name: 'assignedMemberId', required: false, type: String })
  @ApiQuery({ name: 'overdue', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('assignedMemberId') assignedMemberId?: string,
    @Query('overdue') overdue?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.activitiesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      status,
      priority,
      researchProjectId,
      assignedMemberId,
      overdue,
      sortBy,
      sortOrder,
      userRole: req.user.role,
      userId: req.user.id,
    });

    return {
      success: true,
      data: result,
      message: 'Activities retrieved successfully',
    };
  }

  @Get('my')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get activities for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'overdue', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'User activities retrieved successfully' })
  async findMyActivities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('overdue') overdue?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.activitiesService.getMyActivities(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      status,
      priority,
      overdue,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'User activities retrieved successfully',
    };
  }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get overdue activities' })
  @ApiResponse({ status: 200, description: 'Overdue activities retrieved successfully' })
  async findOverdueActivities(@Request() req: any) {
    const result = await this.activitiesService.getOverdueActivities(
      req.user.role,
      req.user.id,
    );

    return {
      success: true,
      data: result,
      message: 'Overdue activities retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get activity summary statistics' })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Activity summary retrieved successfully' })
  async getSummary(@Query('researchProjectId') researchProjectId?: string) {
    const result = await this.activitiesService.getSummary(researchProjectId);

    return {
      success: true,
      data: result,
      message: 'Activity summary retrieved successfully',
    };
  }

  @Get('project/:projectId/stats')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get activity statistics for a specific project' })
  @ApiParam({ name: 'projectId', description: 'Research project UUID' })
  @ApiResponse({ status: 200, description: 'Project activity stats retrieved successfully' })
  async getProjectActivityStats(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const result = await this.activitiesService.getProjectActivityStats(projectId);

    return {
      success: true,
      data: result,
      message: 'Project activity stats retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.activitiesService.findById(id);

    return {
      success: true,
      data: result,
      message: 'Activity retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Body() dto: CreateProjectActivityDto,
    @Request() req: any,
  ) {
    const result = await this.activitiesService.create(dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Activity created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update a project activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectActivityDto,
    @Request() req: any,
  ) {
    const result = await this.activitiesService.update(id, dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Activity updated successfully',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update activity status' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectActivityStatusDto,
    @Request() req: any,
  ) {
    const result = await this.activitiesService.updateStatus(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Activity status updated successfully',
    };
  }

  @Patch(':id/progress')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update activity progress' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity progress updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid progress value' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectActivityProgressDto,
    @Request() req: any,
  ) {
    const result = await this.activitiesService.updateProgress(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Activity progress updated successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a project activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Activity already cancelled' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.activitiesService.cancel(id, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Activity cancelled successfully',
    };
  }
}
