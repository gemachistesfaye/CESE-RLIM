import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ResearchProjectsService } from './research-projects.service';
import { CreateResearchProjectDto } from './dto/create-research-project.dto';
import { UpdateResearchProjectDto } from './dto/update-research-project.dto';
import { UpdateResearchProjectStatusDto } from './dto/update-research-project-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Research Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-projects')
export class ResearchProjectsController {
  constructor(private readonly researchProjectsService: ResearchProjectsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all research projects with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Research projects retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.researchProjectsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'Research projects retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get research project summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getSummary() {
    const result = await this.researchProjectsService.getSummary();
    return {
      success: true,
      data: result,
      message: 'Research project summary retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get research project by ID' })
  @ApiResponse({ status: 200, description: 'Research project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Research project not found' })
  async findById(@Param('id') id: string) {
    const result = await this.researchProjectsService.findById(id);
    return {
      success: true,
      data: result,
      message: 'Research project retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a new research project' })
  @ApiResponse({ status: 201, description: 'Research project created successfully' })
  @ApiResponse({ status: 409, description: 'Project code already exists' })
  async create(@Body() dto: CreateResearchProjectDto, @Request() req: any) {
    const result = await this.researchProjectsService.create(dto, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Research project created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update a research project' })
  @ApiResponse({ status: 200, description: 'Research project updated successfully' })
  @ApiResponse({ status: 404, description: 'Research project not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateResearchProjectDto,
    @Request() req: any,
  ) {
    const result = await this.researchProjectsService.update(id, dto, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Research project updated successfully',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update research project status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Research project not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateResearchProjectStatusDto,
    @Request() req: any,
  ) {
    const result = await this.researchProjectsService.updateStatus(id, dto, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Research project status updated successfully',
    };
  }

  @Get(':id/members')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get research project members' })
  @ApiResponse({ status: 200, description: 'Project members retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Research project not found' })
  async getMembers(@Param('id') id: string) {
    const result = await this.researchProjectsService.getProjectMembers(id);
    return {
      success: true,
      data: result,
      message: 'Project members retrieved successfully',
    };
  }
}
