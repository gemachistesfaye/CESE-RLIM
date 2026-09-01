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
import { UserRole, GrantStatus } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';
import { ResearchGrantsService } from './research-grants.service';
import { CreateResearchGrantDto } from './dto/create-research-grant.dto';
import { UpdateResearchGrantDto } from './dto/update-research-grant.dto';
import { UpdateGrantSpendingDto } from './dto/update-grant-spending.dto';
import { UpdateGrantStatusDto } from './dto/update-grant-status.dto';

@ApiTags('Research Grants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-grants')
export class ResearchGrantsController {
  constructor(
    private readonly grantsService: ResearchGrantsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get all research grants with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'SUSPENDED', 'CANCELLED'] })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiQuery({ name: 'principalInvestigatorId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Grants retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('principalInvestigatorId') principalInvestigatorId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.grantsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      status,
      researchProjectId,
      principalInvestigatorId,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'Grants retrieved successfully',
    };
  }

  @Get('my')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get grants for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'SUSPENDED', 'CANCELLED'] })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'User grants retrieved successfully' })
  async findMyGrants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.grantsService.getMyGrants(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      status,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'User grants retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get grant summary statistics' })
  @ApiResponse({ status: 200, description: 'Grant summary retrieved successfully' })
  async getSummary() {
    const result = await this.grantsService.getSummary();

    return {
      success: true,
      data: result,
      message: 'Grant summary retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get grant by ID' })
  @ApiParam({ name: 'id', description: 'Research grant UUID' })
  @ApiResponse({ status: 200, description: 'Grant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Grant not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.grantsService.findById(id);

    return {
      success: true,
      data: result,
      message: 'Grant retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new research grant' })
  @ApiResponse({ status: 201, description: 'Grant created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async create(
    @Body() dto: CreateResearchGrantDto,
    @Request() req: any,
  ) {
    const result = await this.grantsService.create(dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Grant created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update a research grant' })
  @ApiParam({ name: 'id', description: 'Research grant UUID' })
  @ApiResponse({ status: 200, description: 'Grant updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Grant not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResearchGrantDto,
    @Request() req: any,
  ) {
    const result = await this.grantsService.update(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Grant updated successfully',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update grant status' })
  @ApiParam({ name: 'id', description: 'Research grant UUID' })
  @ApiResponse({ status: 200, description: 'Grant status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Grant not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGrantStatusDto,
    @Request() req: any,
  ) {
    const result = await this.grantsService.updateStatus(id, dto.status, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Grant status updated successfully',
    };
  }

  @Patch(':id/spending')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update grant spending' })
  @ApiParam({ name: 'id', description: 'Research grant UUID' })
  @ApiResponse({ status: 200, description: 'Grant spending updated successfully' })
  @ApiResponse({ status: 400, description: 'Spending exceeds awarded amount' })
  @ApiResponse({ status: 404, description: 'Grant not found' })
  async updateSpending(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGrantSpendingDto,
    @Request() req: any,
  ) {
    const result = await this.grantsService.updateSpending(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Grant spending updated successfully',
    };
  }
}
