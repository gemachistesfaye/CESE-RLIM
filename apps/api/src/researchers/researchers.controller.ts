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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ResearchersService } from './researchers.service';
import { CreateResearcherDto } from './dto/create-researcher.dto';
import { UpdateResearcherDto } from './dto/update-researcher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';

@ApiTags('Researchers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('researchers')
export class ResearchersController {
  constructor(private readonly researchersService: ResearchersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all researchers with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, ID, department, expertise' })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Filter by department' })
  @ApiQuery({ name: 'position', required: false, type: String, description: 'Filter by academic position' })
  @ApiResponse({ status: 200, description: 'Researchers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('position') position?: string,
  ) {
    return this.researchersService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      department,
      position,
    });
  }

  @Get('me')
  @Roles(UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get current researcher profile' })
  @ApiResponse({ status: 200, description: 'Current researcher profile' })
  @ApiResponse({ status: 404, description: 'Researcher profile not found' })
  async findMe(@Request() req: any) {
    return this.researchersService.findByUserId(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get researcher by ID' })
  @ApiResponse({ status: 200, description: 'Researcher retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Researcher not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.researchersService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a researcher with linked user account (transactional)' })
  @ApiResponse({ status: 201, description: 'Researcher created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate email or employee/student ID' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() dto: CreateResearcherDto, @Request() req: any) {
    return this.researchersService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update researcher profile (admin/coordinator)' })
  @ApiResponse({ status: 200, description: 'Researcher updated successfully' })
  @ApiResponse({ status: 404, description: 'Researcher not found' })
  @ApiResponse({ status: 409, description: 'Duplicate employee/student ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResearcherDto,
    @Request() req: any,
  ) {
    return this.researchersService.update(id, dto, req.user.id);
  }

  @Patch('me/profile')
  @Roles(UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update own researcher profile (self-service)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Researcher profile not found' })
  @ApiResponse({ status: 409, description: 'Duplicate employee/student ID' })
  async updateMe(@Body() dto: UpdateResearcherDto, @Request() req: any) {
    return this.researchersService.updateMe(req.user.id, dto);
  }
}
