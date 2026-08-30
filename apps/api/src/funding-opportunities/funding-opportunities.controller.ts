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
import { FundingOpportunitiesService } from './funding-opportunities.service';
import { CreateFundingOpportunityDto } from './dto/create-funding-opportunity.dto';
import { UpdateFundingOpportunityDto } from './dto/update-funding-opportunity.dto';
import { UpdateFundingOpportunityStatusDto } from './dto/update-funding-opportunity-status.dto';

@ApiTags('Funding Opportunities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('funding-opportunities')
export class FundingOpportunitiesController {
  constructor(
    private readonly opportunitiesService: FundingOpportunitiesService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all funding opportunities with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED', 'UPCOMING', 'CANCELLED'] })
  @ApiQuery({ name: 'fundingType', required: false, enum: ['INTERNAL', 'NATIONAL', 'INTERNATIONAL', 'INDUSTRY', 'NGO', 'UNIVERSITY', 'OTHER'] })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Funding opportunities retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('fundingType') fundingType?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.opportunitiesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      fundingType,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'Funding opportunities retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get funding opportunity summary statistics' })
  @ApiResponse({ status: 200, description: 'Funding opportunity summary retrieved successfully' })
  async getSummary() {
    const result = await this.opportunitiesService.getSummary();

    return {
      success: true,
      data: result,
      message: 'Funding opportunity summary retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get funding opportunity by ID' })
  @ApiParam({ name: 'id', description: 'Funding opportunity UUID' })
  @ApiResponse({ status: 200, description: 'Funding opportunity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Funding opportunity not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.opportunitiesService.findById(id);

    return {
      success: true,
      data: result,
      message: 'Funding opportunity retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new funding opportunity' })
  @ApiResponse({ status: 201, description: 'Funding opportunity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() dto: CreateFundingOpportunityDto,
    @Request() req: any,
  ) {
    const result = await this.opportunitiesService.create(dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Funding opportunity created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update a funding opportunity' })
  @ApiParam({ name: 'id', description: 'Funding opportunity UUID' })
  @ApiResponse({ status: 200, description: 'Funding opportunity updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Funding opportunity not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFundingOpportunityDto,
    @Request() req: any,
  ) {
    const result = await this.opportunitiesService.update(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Funding opportunity updated successfully',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update funding opportunity status' })
  @ApiParam({ name: 'id', description: 'Funding opportunity UUID' })
  @ApiResponse({ status: 200, description: 'Funding opportunity status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status change' })
  @ApiResponse({ status: 404, description: 'Funding opportunity not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFundingOpportunityStatusDto,
    @Request() req: any,
  ) {
    const result = await this.opportunitiesService.updateStatus(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Funding opportunity status updated successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a funding opportunity' })
  @ApiParam({ name: 'id', description: 'Funding opportunity UUID' })
  @ApiResponse({ status: 200, description: 'Funding opportunity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Funding opportunity not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.opportunitiesService.delete(id, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Funding opportunity deleted successfully',
    };
  }
}
