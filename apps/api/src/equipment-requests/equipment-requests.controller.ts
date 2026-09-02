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
import { EquipmentRequestsService } from './equipment-requests.service';
import { CreateEquipmentRequestDto } from './dto/create-equipment-request.dto';
import { ReviewEquipmentRequestDto } from './dto/review-equipment-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Equipment Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment-requests')
export class EquipmentRequestsController {
  constructor(private readonly equipmentRequestsService: EquipmentRequestsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all equipment requests with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ISSUED', 'IN_USE', 'RETURNED', 'CLOSED', 'CANCELLED'] })
  @ApiQuery({ name: 'equipmentId', required: false, type: String })
  @ApiQuery({ name: 'requesterId', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Equipment requests retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('requesterId') requesterId?: string,
    @Query('priority') priority?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Request() req?: any,
  ) {
    return this.equipmentRequestsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      equipmentId,
      requesterId,
      priority,
      userId: req.user.id,
      userRole: req.user.role,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get equipment request by ID' })
  @ApiResponse({ status: 200, description: 'Equipment request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment request not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.equipmentRequestsService.findById(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles(UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Create a new equipment request' })
  @ApiBody({ type: CreateEquipmentRequestDto })
  @ApiResponse({ status: 201, description: 'Equipment request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or equipment not available' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async create(@Body() dto: CreateEquipmentRequestDto, @Request() req: any) {
    return this.equipmentRequestsService.create(dto, req.user.id);
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Review (approve/reject) an equipment request' })
  @ApiBody({ type: ReviewEquipmentRequestDto })
  @ApiResponse({ status: 200, description: 'Request reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Equipment request not found' })
  @ApiResponse({ status: 409, description: 'Request has already been reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewEquipmentRequestDto,
    @Request() req: any,
  ) {
    return this.equipmentRequestsService.review(id, dto, req.user.id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Cancel an equipment request' })
  @ApiResponse({ status: 200, description: 'Request cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Equipment request not found' })
  @ApiResponse({ status: 409, description: 'Request cannot be cancelled' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.equipmentRequestsService.cancel(id, req.user.id);
  }
}
