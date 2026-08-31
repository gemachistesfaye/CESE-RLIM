import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BudgetAllocationsService } from './budget-allocations.service';
import { CreateBudgetAllocationDto } from './dto/create-budget-allocation.dto';
import { UpdateBudgetAllocationDto } from './dto/update-budget-allocation.dto';

@ApiTags('Budget Allocations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('budget-allocations')
export class BudgetAllocationsController {
  constructor(private readonly budgetAllocationsService: BudgetAllocationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'List budget allocations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'researchGrantId', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('researchGrantId') researchGrantId?: string,
    @Query('category') category?: string,
  ) {
    const result = await this.budgetAllocationsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      researchGrantId,
      category,
    });
    return { success: true, data: result };
  }

  @Get('grant/:grantId')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get allocations by grant' })
  @ApiParam({ name: 'grantId', description: 'Research grant UUID' })
  async findByGrant(@Param('grantId') grantId: string) {
    const result = await this.budgetAllocationsService.findByGrant(grantId);
    return { success: true, data: result };
  }

  @Get('grant/:grantId/summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get category summary for grant' })
  @ApiParam({ name: 'grantId', description: 'Research grant UUID' })
  async getCategorySummary(@Param('grantId') grantId: string) {
    const result = await this.budgetAllocationsService.getCategorySummary(grantId);
    return { success: true, data: result };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get allocation by ID' })
  @ApiParam({ name: 'id', description: 'Budget allocation UUID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.budgetAllocationsService.findById(id);
    return { success: true, data: result };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create budget allocation' })
  async create(@Body() dto: CreateBudgetAllocationDto, @Req() req: any) {
    const result = await this.budgetAllocationsService.create(dto, req.user.id);
    return { success: true, data: result, message: 'Budget allocation created' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update budget allocation' })
  @ApiParam({ name: 'id', description: 'Budget allocation UUID' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBudgetAllocationDto, @Req() req: any) {
    const result = await this.budgetAllocationsService.update(id, dto, req.user.id);
    return { success: true, data: result, message: 'Budget allocation updated' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Delete budget allocation' })
  @ApiParam({ name: 'id', description: 'Budget allocation UUID' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const result = await this.budgetAllocationsService.delete(id, req.user.id);
    return { success: true, data: result, message: 'Budget allocation deleted' };
  }
}
