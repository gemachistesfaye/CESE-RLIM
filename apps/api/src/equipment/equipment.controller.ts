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
  ApiBody,
} from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all equipment with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['AVAILABLE', 'RESERVED', 'IN_USE', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED'] })
  @ApiQuery({ name: 'condition', required: false, enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'laboratoryId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('condition') condition?: string,
    @Query('category') category?: string,
    @Query('laboratoryId') laboratoryId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.equipmentService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      condition,
      category,
      laboratoryId,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiBody({ type: CreateEquipmentDto })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  @ApiResponse({ status: 409, description: 'Equipment with this asset ID or serial number already exists' })
  @ApiResponse({ status: 404, description: 'Laboratory not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() dto: CreateEquipmentDto, @Request() req: any) {
    return this.equipmentService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update equipment information' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @ApiResponse({ status: 409, description: 'Serial number already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
    @Request() req: any,
  ) {
    return this.equipmentService.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Change equipment status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentStatusDto,
    @Request() req: any,
  ) {
    return this.equipmentService.updateStatus(id, dto, req.user.id);
  }
}
