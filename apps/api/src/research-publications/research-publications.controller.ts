import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { UserRole } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';
import { ResearchPublicationsService } from './research-publications.service';
import { CreateResearchPublicationDto } from './dto/create-research-publication.dto';
import { UpdateResearchPublicationDto } from './dto/update-research-publication.dto';
import { UpdatePublicationStatusDto } from './dto/update-publication-status.dto';
import { ManagePublicationAuthorsDto } from './dto/manage-publication-authors.dto';

@ApiTags('Research Publications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-publications')
export class ResearchPublicationsController {
  constructor(
    private readonly publicationsService: ResearchPublicationsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all research publications with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'PUBLISHED', 'REJECTED'] })
  @ApiQuery({ name: 'publicationType', required: false, enum: ['JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER', 'THESIS', 'TECHNICAL_REPORT', 'WORKING_PAPER', 'PATENT', 'OTHER'] })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Publications retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('publicationType') publicationType?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.publicationsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      status,
      publicationType,
      researchProjectId,
      sortBy,
      sortOrder,
      userRole: req.user.role,
      userId: req.user.id,
    });

    return {
      success: true,
      data: result,
      message: 'Publications retrieved successfully',
    };
  }

  @Get('my')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get publications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'PUBLISHED', 'REJECTED'] })
  @ApiQuery({ name: 'publicationType', required: false, enum: ['JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER', 'THESIS', 'TECHNICAL_REPORT', 'WORKING_PAPER', 'PATENT', 'OTHER'] })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'User publications retrieved successfully' })
  async findMyPublications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('publicationType') publicationType?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.publicationsService.getMyPublications(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      status,
      publicationType,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'User publications retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get publication summary statistics' })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Publication summary retrieved successfully' })
  async getSummary(@Query('researchProjectId') researchProjectId?: string) {
    const result = await this.publicationsService.getSummary(researchProjectId);

    return {
      success: true,
      data: result,
      message: 'Publication summary retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get publication by ID' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiResponse({ status: 200, description: 'Publication retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.publicationsService.findById(id);

    return {
      success: true,
      data: result,
      message: 'Publication retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new research publication' })
  @ApiResponse({ status: 201, description: 'Publication created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Body() dto: CreateResearchPublicationDto,
    @Request() req: any,
  ) {
    const result = await this.publicationsService.create(dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Publication created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update a research publication' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiResponse({ status: 200, description: 'Publication updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResearchPublicationDto,
    @Request() req: any,
  ) {
    const result = await this.publicationsService.update(id, dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Publication updated successfully',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update publication status' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiResponse({ status: 200, description: 'Publication status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublicationStatusDto,
    @Request() req: any,
  ) {
    const result = await this.publicationsService.updateStatus(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Publication status updated successfully',
    };
  }

  @Patch(':id/authors')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Manage publication authors (replace all)' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiResponse({ status: 200, description: 'Publication authors updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate authors' })
  @ApiResponse({ status: 404, description: 'Publication or researcher not found' })
  async manageAuthors(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManagePublicationAuthorsDto,
    @Request() req: any,
  ) {
    const result = await this.publicationsService.manageAuthors(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Publication authors updated successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a research publication' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiResponse({ status: 200, description: 'Publication deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete published publication' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.publicationsService.remove(id, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Publication deleted successfully',
    };
  }
}
