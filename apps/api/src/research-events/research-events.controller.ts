import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, EventStatus } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';
import { ResearchEventsService } from './research-events.service';
import { CreateResearchEventDto } from './dto/create-research-event.dto';
import { UpdateResearchEventDto } from './dto/update-research-event.dto';
import { UpdateResearchEventStatusDto } from './dto/update-research-event-status.dto';

@ApiTags('Research Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-events')
export class ResearchEventsController {
  constructor(private readonly researchEventsService: ResearchEventsService) {}

  @Get()
  @ApiOperation({ summary: 'List research events' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'isVirtual', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'upcoming', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
    @Query('isVirtual') isVirtual?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('upcoming') upcoming?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.researchEventsService.findAll({
      page: parseInt(page || '1', 10),
      limit: safeLimit(limit),
      search,
      status,
      eventType,
      isVirtual,
      startDate,
      endDate,
      upcoming,
      sortBy,
      sortOrder,
    });
    return { success: true, data: result };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get event statistics' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getSummary() {
    const result = await this.researchEventsService.getSummary();
    return { success: true, data: result };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  async getUpcoming() {
    const result = await this.researchEventsService.getUpcoming();
    return { success: true, data: result };
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get events by project' })
  async getByProject(@Param('projectId') projectId: string) {
    const result = await this.researchEventsService.getByProject(projectId);
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async findById(@Param('id') id: string) {
    const result = await this.researchEventsService.findById(id);
    return { success: true, data: result };
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get event participants' })
  async getParticipants(@Param('id') id: string) {
    const result = await this.researchEventsService.getParticipants(id);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create research event' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async create(@Body() dto: CreateResearchEventDto, @Req() req: any) {
    const result = await this.researchEventsService.create(dto, req.user.id);
    return { success: true, data: result, message: 'Research event created' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update research event' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async update(@Param('id') id: string, @Body() dto: UpdateResearchEventDto, @Req() req: any) {
    const result = await this.researchEventsService.update(id, dto, req.user.id);
    return { success: true, data: result, message: 'Research event updated' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update event status' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateResearchEventStatusDto, @Req() req: any) {
    const result = await this.researchEventsService.updateStatus(id, dto.status, req.user.id);
    return { success: true, data: result, message: 'Event status updated' };
  }
}
