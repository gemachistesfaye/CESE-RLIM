import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ResearchReportsService } from './research-reports.service';
import { CreateResearchReportDto } from './dto/create-research-report.dto';
import { UpdateResearchReportDto } from './dto/update-research-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { SubmitForReviewDto } from './dto/submit-for-review.dto';

@ApiTags('Research Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-reports')
export class ResearchReportsController {
  constructor(private readonly reportsService: ResearchReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'List all reports' })
  findAll(
    @Query('page') page = '1', @Query('limit') limit = '10', @Query('search') search?: string,
    @Query('status') status?: string, @Query('reportType') reportType?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Req() req?: any,
  ) {
    return this.reportsService.findAll({
      page: parseInt(page, 10) || 1, limit: parseInt(limit, 10) || 10,
      search, status, reportType, researchProjectId, sortBy, sortOrder,
      userId: req?.user?.id, userRole: req?.user?.role,
    });
  }

  @Get('my')
  @Roles(UserRole.RESEARCHER, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'List my reports' })
  findMyReports(
    @Req() req: any,
    @Query('page') page = '1', @Query('limit') limit = '10', @Query('status') status?: string,
  ) {
    return this.reportsService.findMyReports({
      userId: req.user.id, page: parseInt(page, 10) || 1, limit: parseInt(limit, 10) || 10, status,
    });
  }

  @Get('review-queue')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get reports pending review' })
  getReviewQueue(
    @Req() req: any,
    @Query('page') page = '1', @Query('limit') limit = '10', @Query('status') status?: string,
  ) {
    return this.reportsService.findByReviewer(req.user.id, {
      page: parseInt(page, 10) || 1, limit: parseInt(limit, 10) || 10, status,
    });
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get reports summary' })
  getSummary() { return this.reportsService.getSummary(); }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get reports for a project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.reportsService.findByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details' })
  findOne(@Param('id') id: string) { return this.reportsService.findById(id); }

  @Post()
  @Roles(UserRole.RESEARCHER, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a new report' })
  create(@Body() dto: CreateResearchReportDto, @Req() req: any) {
    return this.reportsService.create(dto, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.RESEARCHER, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update a report' })
  update(@Param('id') id: string, @Body() dto: UpdateResearchReportDto, @Req() req: any) {
    return this.reportsService.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update report status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReportStatusDto, @Req() req: any) {
    return this.reportsService.updateStatus(id, dto.status, req.user.id, dto.reviewComment);
  }

  @Patch(':id/submit')
  @Roles(UserRole.RESEARCHER, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Submit report for review' })
  submit(@Param('id') id: string, @Req() req: any) {
    return this.reportsService.submit(id, req.user.id);
  }

  @Patch(':id/submit-for-review')
  @Roles(UserRole.RESEARCHER, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Submit report and assign reviewer' })
  submitForReview(@Param('id') id: string, @Body() dto: SubmitForReviewDto, @Req() req: any) {
    return this.reportsService.submitForReview(id, dto.reviewerId, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Delete a report' })
  remove(@Param('id') id: string, @Req() req: any) { return this.reportsService.delete(id, req.user.id); }
}
