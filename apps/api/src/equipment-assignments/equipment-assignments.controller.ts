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
import { EquipmentAssignmentsService } from './equipment-assignments.service';
import { CreateEquipmentAssignmentDto } from './dto/create-equipment-assignment.dto';
import { ReturnEquipmentAssignmentDto } from './dto/return-equipment-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Equipment Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment-assignments')
export class EquipmentAssignmentsController {
  constructor(private readonly equipmentAssignmentsService: EquipmentAssignmentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all equipment assignments with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'RETURNED'] })
  @ApiQuery({ name: 'equipmentId', required: false, type: String })
  @ApiQuery({ name: 'researcherId', required: false, type: String })
  @ApiQuery({ name: 'laboratoryId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Equipment assignments retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('researcherId') researcherId?: string,
    @Query('laboratoryId') laboratoryId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Request() req?: any,
  ) {
    return this.equipmentAssignmentsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      equipmentId,
      researcherId,
      laboratoryId,
      userId: req.user.id,
      userRole: req.user.role,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get equipment assignment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment assignment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment assignment not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.equipmentAssignmentsService.findById(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a new equipment assignment' })
  @ApiBody({ type: CreateEquipmentAssignmentDto })
  @ApiResponse({ status: 201, description: 'Equipment assignment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or equipment not available' })
  @ApiResponse({ status: 404, description: 'Request or equipment not found' })
  @ApiResponse({ status: 409, description: 'Request not approved or equipment already assigned' })
  async create(@Body() dto: CreateEquipmentAssignmentDto, @Request() req: any) {
    return this.equipmentAssignmentsService.create(dto, req.user.id);
  }

  @Patch(':id/return')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Return assigned equipment' })
  @ApiBody({ type: ReturnEquipmentAssignmentDto })
  @ApiResponse({ status: 200, description: 'Equipment returned successfully' })
  @ApiResponse({ status: 404, description: 'Equipment assignment not found' })
  @ApiResponse({ status: 409, description: 'Equipment already returned' })
  async returnEquipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnEquipmentAssignmentDto,
    @Request() req: any,
  ) {
    return this.equipmentAssignmentsService.returnEquipment(id, dto, req.user.id);
  }
}
