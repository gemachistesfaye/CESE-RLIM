import {
  Controller,
  Get,
  Post,
  Patch,
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
import { GrantApplicationsService } from './grant-applications.service';
import { CreateGrantApplicationDto } from './dto/create-grant-application.dto';
import { UpdateGrantApplicationDto } from './dto/update-grant-application.dto';
import { ReviewGrantApplicationDto } from './dto/review-grant-application.dto';

@ApiTags('Grant Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grant-applications')
export class GrantApplicationsController {
  constructor(
    private readonly grantApplicationsService: GrantApplicationsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get all grant applications with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'] })
  @ApiQuery({ name: 'opportunityId', required: false, type: String })
  @ApiQuery({ name: 'applicantId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Grant applications retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('opportunityId') opportunityId?: string,
    @Query('applicantId') applicantId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.grantApplicationsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      status,
      opportunityId,
      applicantId,
      sortBy,
      sortOrder,
      userRole: req.user.role,
      userId: req.user.id,
    });

    return {
      success: true,
      data: result,
      message: 'Grant applications retrieved successfully',
    };
  }

  @Get('my')
  @Roles(UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get grant applications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'] })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'User grant applications retrieved successfully' })
  async findMyApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.grantApplicationsService.getMyApplications(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      status,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'User grant applications retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get grant application summary statistics' })
  @ApiQuery({ name: 'opportunityId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Grant application summary retrieved successfully' })
  async getSummary(@Query('opportunityId') opportunityId?: string) {
    const result = await this.grantApplicationsService.getSummary(opportunityId);

    return {
      success: true,
      data: result,
      message: 'Grant application summary retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get grant application by ID' })
  @ApiParam({ name: 'id', description: 'Grant application UUID' })
  @ApiResponse({ status: 200, description: 'Grant application retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Grant application not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.grantApplicationsService.findById(id);

    return {
      success: true,
      data: result,
      message: 'Grant application retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new grant application' })
  @ApiResponse({ status: 201, description: 'Grant application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Funding opportunity not found' })
  async create(
    @Body() dto: CreateGrantApplicationDto,
    @Request() req: any,
  ) {
    const result = await this.grantApplicationsService.create(dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Grant application created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update a grant application' })
  @ApiParam({ name: 'id', description: 'Grant application UUID' })
  @ApiResponse({ status: 200, description: 'Grant application updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or application not in DRAFT status' })
  @ApiResponse({ status: 404, description: 'Grant application not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGrantApplicationDto,
    @Request() req: any,
  ) {
    const result = await this.grantApplicationsService.update(id, dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Grant application updated successfully',
    };
  }

  @Patch(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Submit a grant application' })
  @ApiParam({ name: 'id', description: 'Grant application UUID' })
  @ApiResponse({ status: 200, description: 'Grant application submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Grant application not found' })
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.grantApplicationsService.submit(id, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Grant application submitted successfully',
    };
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Review a grant application (approve or reject)' })
  @ApiParam({ name: 'id', description: 'Grant application UUID' })
  @ApiResponse({ status: 200, description: 'Grant application reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition or missing review comment for rejection' })
  @ApiResponse({ status: 404, description: 'Grant application not found' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewGrantApplicationDto,
    @Request() req: any,
  ) {
    const result = await this.grantApplicationsService.review(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: `Grant application ${dto.decision === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
    };
  }

  @Patch(':id/withdraw')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Withdraw a grant application' })
  @ApiParam({ name: 'id', description: 'Grant application UUID' })
  @ApiResponse({ status: 200, description: 'Grant application withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Grant application not found' })
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.grantApplicationsService.withdraw(id, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Grant application withdrawn successfully',
    };
  }
}
