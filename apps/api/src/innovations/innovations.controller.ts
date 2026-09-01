import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { safeLimit } from '../common/utils/pagination.util';
import { InnovationsService } from './innovations.service';
import { CreateInnovationDto } from './dto/create-innovation.dto';
import { UpdateInnovationDto } from './dto/update-innovation.dto';
import { UpdateInnovationStatusDto } from './dto/update-innovation-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Innovations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('innovations')
export class InnovationsController {
  constructor(private readonly innovationsService: InnovationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all innovations with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['SUBMITTED', 'UNDER_EVALUATION', 'APPROVED', 'REJECTED', 'COMPLETED'] })
  @ApiQuery({ name: 'developmentStage', required: false, enum: ['IDEA', 'PROTOTYPE', 'TESTING', 'VALIDATED', 'TRANSFERRED'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiQuery({ name: 'submittedById', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Innovations retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('developmentStage') developmentStage?: string,
    @Query('category') category?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('submittedById') submittedById?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.innovationsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      status,
      developmentStage,
      category,
      researchProjectId,
      submittedById,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'Innovations retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get innovation summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getSummary() {
    const result = await this.innovationsService.getSummary();
    return {
      success: true,
      data: result,
      message: 'Innovation summary retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get innovation by ID' })
  @ApiResponse({ status: 200, description: 'Innovation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Innovation not found' })
  async findById(@Param('id') id: string) {
    const result = await this.innovationsService.findById(id);
    return {
      success: true,
      data: result,
      message: 'Innovation retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Create a new innovation' })
  @ApiResponse({ status: 201, description: 'Innovation created successfully' })
  @ApiResponse({ status: 404, description: 'Researcher or project not found' })
  async create(@Body() dto: CreateInnovationDto, @Request() req: any) {
    const result = await this.innovationsService.create(dto, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Innovation created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update an innovation' })
  @ApiResponse({ status: 200, description: 'Innovation updated successfully' })
  @ApiResponse({ status: 404, description: 'Innovation not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInnovationDto,
    @Request() req: any,
  ) {
    const result = await this.innovationsService.update(id, dto, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Innovation updated successfully',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update innovation status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Innovation not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInnovationStatusDto,
    @Request() req: any,
  ) {
    const result = await this.innovationsService.updateStatus(id, dto, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Innovation status updated successfully',
    };
  }
}
