import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';
import { ResearchMilestonesService } from './research-milestones.service';
import { CreateResearchMilestoneDto } from './dto/create-research-milestone.dto';
import { UpdateResearchMilestoneDto } from './dto/update-research-milestone.dto';
import { UpdateMilestoneStatusDto } from './dto/update-milestone-status.dto';
import { UpdateMilestoneProgressDto } from './dto/update-milestone-progress.dto';

@ApiTags('Research Milestones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-milestones')
export class ResearchMilestonesController {
  constructor(private readonly milestonesService: ResearchMilestonesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'List all milestones' })
  findAll(
    @Query('page') page = '1', @Query('limit') limit = '10', @Query('search') search?: string,
    @Query('status') status?: string, @Query('researchProjectId') researchProjectId?: string,
    @Query('responsibleMemberId') responsibleMemberId?: string, @Query('overdue') overdue?: string,
    @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Req() req?: any,
  ) {
    return this.milestonesService.findAll({
      page: parseInt(page, 10) || 1,       limit: safeLimit(limit, 10),
      search, status, researchProjectId, responsibleMemberId, overdue, sortBy, sortOrder,
      userId: req?.user?.id, userRole: req?.user?.role,
    });
  }

  @Get('my')
  @Roles(UserRole.RESEARCHER, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'List my assigned milestones' })
  findMyMilestones(
    @Req() req: any,
    @Query('page') page = '1', @Query('limit') limit = '10', @Query('status') status?: string,
  ) {
    return this.milestonesService.findMyMilestones({
      userId: req.user.id, page: parseInt(page, 10) || 1,       limit: safeLimit(limit, 10), status,
    });
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get milestones summary' })
  getSummary() { return this.milestonesService.getSummary(); }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get overdue milestones' })
  getOverdue() { return this.milestonesService.findOverdue(); }

  @Get('upcoming')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get upcoming milestones' })
  getUpcoming() { return this.milestonesService.findUpcoming(); }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get milestones for a project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.milestonesService.findByProject(projectId);
  }

  @Get('project/:projectId/progress')
  @ApiOperation({ summary: 'Get project progress summary' })
  getProjectProgress(@Param('projectId') projectId: string) {
    return this.milestonesService.getProjectProgress(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get milestone details' })
  findOne(@Param('id') id: string) { return this.milestonesService.findById(id); }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a new milestone' })
  create(@Body() dto: CreateResearchMilestoneDto, @Req() req: any) {
    return this.milestonesService.create(dto, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update a milestone' })
  update(@Param('id') id: string, @Body() dto: UpdateResearchMilestoneDto, @Req() req: any) {
    return this.milestonesService.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update milestone status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMilestoneStatusDto, @Req() req: any) {
    return this.milestonesService.updateStatus(id, dto.status, req.user.id);
  }

  @Patch(':id/progress')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update milestone progress' })
  updateProgress(@Param('id') id: string, @Body() dto: UpdateMilestoneProgressDto, @Req() req: any) {
    return this.milestonesService.updateProgress(id, dto.progress, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a milestone' })
  remove(@Param('id') id: string, @Req() req: any) { return this.milestonesService.delete(id, req.user.id); }
}
