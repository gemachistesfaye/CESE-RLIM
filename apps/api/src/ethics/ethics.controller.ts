import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, EthicsApplicationStatus } from '@prisma/client';
import { EthicsService } from './ethics.service';
import { CreateEthicsApplicationDto } from './dto/create-ethics-application.dto';
import { UpdateEthicsApplicationDto } from './dto/update-ethics-application.dto';
import { ReviewEthicsApplicationDto } from './dto/review-ethics-application.dto';
import { AssignEthicsReviewerDto } from './dto/assign-ethics-reviewer.dto';
import { UpdateEthicsStatusDto } from './dto/update-ethics-status.dto';

@ApiTags('Ethics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ethics/applications')
export class EthicsController {
  constructor(private readonly ethicsService: EthicsService) {}

  @Get()
  @ApiOperation({ summary: 'List ethics applications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiQuery({ name: 'reviewerId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Req() req?: any,
  ) {
    const result = await this.ethicsService.findAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      search,
      status,
      researchProjectId,
      reviewerId,
      sortBy,
      sortOrder,
      userId: req.user.role === UserRole.RESEARCHER ? req.user.id : undefined,
      userRole: req.user.role,
    });
    return { success: true, data: result };
  }

  @Get('my')
  @ApiOperation({ summary: "Get current user's ethics applications" })
  @Roles(UserRole.RESEARCHER, UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getMyApplications(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.ethicsService.getMyApplications({
      userId: req.user.id,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
    });
    return { success: true, data: result };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get ethics application statistics' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getSummary() {
    const result = await this.ethicsService.getSummary();
    return { success: true, data: result };
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue ethics applications' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getOverdue() {
    const result = await this.ethicsService.getOverdue();
    return { success: true, data: result };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending review applications' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getPendingReview() {
    const result = await this.ethicsService.getPendingReview();
    return { success: true, data: result };
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get ethics applications by project' })
  async getByProject(@Param('projectId') projectId: string) {
    const result = await this.ethicsService.getByProject(projectId);
    return { success: true, data: result };
  }

  @Get('researcher/:researcherId')
  @ApiOperation({ summary: 'Get ethics applications by researcher' })
  async getByResearcher(@Param('researcherId') researcherId: string) {
    const result = await this.ethicsService.getByResearcher(researcherId);
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ethics application by ID' })
  async findById(@Param('id') id: string) {
    const result = await this.ethicsService.findById(id);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create ethics application' })
  @Roles(UserRole.RESEARCHER, UserRole.ADMIN, UserRole.COORDINATOR)
  async create(@Body() dto: CreateEthicsApplicationDto, @Req() req: any) {
    const result = await this.ethicsService.create(dto, req.user.id);
    return { success: true, data: result, message: 'Ethics application created' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ethics application' })
  async update(@Param('id') id: string, @Body() dto: UpdateEthicsApplicationDto, @Req() req: any) {
    const result = await this.ethicsService.update(id, dto, req.user.id, req.user.role);
    return { success: true, data: result, message: 'Ethics application updated' };
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit ethics application for review' })
  async submit(@Param('id') id: string, @Req() req: any) {
    const result = await this.ethicsService.submit(id, req.user.id);
    return { success: true, data: result, message: 'Ethics application submitted' };
  }

  @Patch(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw ethics application' })
  async withdraw(@Param('id') id: string, @Req() req: any) {
    const result = await this.ethicsService.withdraw(id, req.user.id);
    return { success: true, data: result, message: 'Ethics application withdrawn' };
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Review ethics application' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async review(@Param('id') id: string, @Body() dto: ReviewEthicsApplicationDto, @Req() req: any) {
    const result = await this.ethicsService.review(id, dto, req.user.id);
    return { success: true, data: result, message: 'Ethics application reviewed' };
  }

  @Post(':id/reviewer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign reviewer to ethics application' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async assignReviewer(@Param('id') id: string, @Body() dto: AssignEthicsReviewerDto, @Req() req: any) {
    const result = await this.ethicsService.assignReviewer(id, dto, req.user.id);
    return { success: true, data: result, message: 'Reviewer assigned' };
  }

  @Patch(':id/reviewer/:reviewerId')
  @ApiOperation({ summary: 'Remove reviewer from ethics application' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async removeReviewer(@Param('id') id: string, @Param('reviewerId') reviewerId: string, @Req() req: any) {
    const result = await this.ethicsService.removeReviewer(id, reviewerId, req.user.id);
    return { success: true, data: result, message: 'Reviewer removed' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ethics application status' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateEthicsStatusDto, @Req() req: any) {
    const result = await this.ethicsService.updateStatus(id, dto.status, req.user.id);
    return { success: true, data: result, message: 'Status updated' };
  }
}
