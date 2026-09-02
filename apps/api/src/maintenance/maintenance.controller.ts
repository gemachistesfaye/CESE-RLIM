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
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { UpdateMaintenanceRecordDto } from './dto/update-maintenance-record.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all maintenance records with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['REPORTED', 'DIAGNOSING', 'REPAIRING', 'TESTING', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'equipmentId', required: false, type: String })
  @ApiQuery({ name: 'laboratoryId', required: false, type: String })
  @ApiQuery({ name: 'technicianId', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Maintenance records retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('laboratoryId') laboratoryId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('priority') priority?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Request() req?: any,
  ) {
    return this.maintenanceService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      status,
      equipmentId,
      laboratoryId,
      technicianId,
      priority,
      startDate,
      endDate,
      userId: req.user.id,
      userRole: req.user.role,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  }

  @Get('my')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get maintenance records assigned to the authenticated technician' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['REPORTED', 'DIAGNOSING', 'REPAIRING', 'TESTING', 'COMPLETED', 'CANCELLED'] })
  @ApiResponse({ status: 200, description: 'My maintenance records retrieved successfully' })
  async findMyMaintenance(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    return this.maintenanceService.findMyMaintenance({
      userId: req.user.id,
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      status,
    });
  }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get overdue maintenance records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Overdue maintenance records retrieved successfully' })
  async findOverdue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    return this.maintenanceService.findOverdue({
      userId: req.user.id,
      userRole: req.user.role,
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
    });
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get maintenance summary statistics' })
  @ApiResponse({ status: 200, description: 'Maintenance summary retrieved successfully' })
  async getSummary() {
    return this.maintenanceService.getSummary();
  }

  @Get('equipment/:equipmentId')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get maintenance history for specific equipment' })
  @ApiResponse({ status: 200, description: 'Equipment maintenance history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async getEquipmentMaintenanceHistory(@Param('equipmentId', ParseUUIDPipe) equipmentId: string) {
    return this.maintenanceService.getEquipmentMaintenanceHistory(equipmentId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get maintenance record by ID' })
  @ApiResponse({ status: 200, description: 'Maintenance record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Maintenance record not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create a new maintenance record' })
  @ApiBody({ type: CreateMaintenanceRecordDto })
  @ApiResponse({ status: 201, description: 'Maintenance record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or equipment not available' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async create(@Body() dto: CreateMaintenanceRecordDto, @Request() req: any) {
    return this.maintenanceService.create(dto, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update maintenance record' })
  @ApiBody({ type: UpdateMaintenanceRecordDto })
  @ApiResponse({ status: 200, description: 'Maintenance record updated successfully' })
  @ApiResponse({ status: 404, description: 'Maintenance record not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceRecordDto,
    @Request() req: any,
  ) {
    return this.maintenanceService.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update maintenance status' })
  @ApiBody({ type: UpdateMaintenanceStatusDto })
  @ApiResponse({ status: 200, description: 'Maintenance status updated successfully' })
  @ApiResponse({ status: 404, description: 'Maintenance record not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @Request() req: any,
  ) {
    return this.maintenanceService.updateStatus(id, dto, req.user.id, req.user.role);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Complete maintenance record' })
  @ApiBody({ type: CompleteMaintenanceDto })
  @ApiResponse({ status: 200, description: 'Maintenance completed successfully' })
  @ApiResponse({ status: 404, description: 'Maintenance record not found' })
  @ApiResponse({ status: 409, description: 'Maintenance already completed or cancelled' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteMaintenanceDto,
    @Request() req: any,
  ) {
    return this.maintenanceService.complete(id, dto, req.user.id);
  }

  @Patch(':id/assign-self')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Technician self-assigns an unassigned maintenance record' })
  @ApiResponse({ status: 200, description: 'Maintenance self-assigned successfully' })
  @ApiResponse({ status: 400, description: 'Already assigned or invalid status' })
  async assignSelf(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.maintenanceService.selfAssign(id, req.user.id);
  }
}
