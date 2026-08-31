import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ParticipationStatus } from '@prisma/client';
import { EventParticipationsService } from './event-participations.service';
import { CreateEventParticipationDto } from './dto/create-event-participation.dto';
import { UpdateParticipationStatusDto } from './dto/update-participation-status.dto';

@ApiTags('Event Participations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('event-participations')
export class EventParticipationsController {
  constructor(private readonly eventParticipationsService: EventParticipationsService) {}

  @Get()
  @ApiOperation({ summary: 'List event participations' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiQuery({ name: 'researcherId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventId') eventId?: string,
    @Query('researcherId') researcherId?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.eventParticipationsService.findAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      eventId,
      researcherId,
      status,
    });
    return { success: true, data: result };
  }

  @Get('my')
  @ApiOperation({ summary: "Get current user's event participations" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findMy(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.eventParticipationsService.findMyParticipations({
      userId: req.user.id,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
    });
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get participation by ID' })
  async findById(@Param('id') id: string) {
    const result = await this.eventParticipationsService.findById(id);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register for an event' })
  @Roles(UserRole.RESEARCHER)
  async register(@Body() dto: CreateEventParticipationDto, @Req() req: any) {
    const result = await this.eventParticipationsService.register(dto, req.user.id);
    return { success: true, data: result, message: 'Registered for event' };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel event registration' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    const result = await this.eventParticipationsService.cancel(id, req.user.id, req.user.role);
    return { success: true, data: result, message: 'Registration cancelled' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update participation status' })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateParticipationStatusDto, @Req() req: any) {
    const result = await this.eventParticipationsService.updateStatus(id, dto.status, req.user.id);
    return { success: true, data: result, message: 'Participation status updated' };
  }
}
