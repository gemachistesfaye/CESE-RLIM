import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ExpenseStatus } from '@prisma/client';
import { safeLimit } from '../common/utils/pagination.util';
import { ResearchExpensesService } from './research-expenses.service';
import { CreateResearchExpenseDto } from './dto/create-research-expense.dto';
import { UpdateResearchExpenseDto } from './dto/update-research-expense.dto';
import { ReviewResearchExpenseDto } from './dto/review-research-expense.dto';

@ApiTags('Research Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-expenses')
export class ResearchExpensesController {
  constructor(private readonly researchExpensesService: ResearchExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List research expenses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'researchGrantId', required: false, type: String })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('researchGrantId') researchGrantId?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.researchExpensesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      search,
      status,
      category,
      researchGrantId,
      researchProjectId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      userId: req.user.id,
      userRole: req.user.role,
    });
    return { success: true, data: result };
  }

  @Get('my')
  @ApiOperation({ summary: "Get current user's expenses" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findMy(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.researchExpensesService.findMyExpenses({
      userId: req.user.id,
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
      status,
    });
    return { success: true, data: result };
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get pending expenses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findPending(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.researchExpensesService.findPending({
      page: page ? parseInt(page, 10) : 1,
      limit: safeLimit(limit),
    });
    return { success: true, data: result };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get expense statistics' })
  async getSummary() {
    const result = await this.researchExpensesService.getSummary();
    return { success: true, data: result };
  }

  @Get('grant/:grantId')
  @ApiOperation({ summary: 'Get expenses by grant' })
  @ApiParam({ name: 'grantId', description: 'Research grant UUID' })
  async getGrantExpenses(@Param('grantId') grantId: string) {
    const result = await this.researchExpensesService.getGrantExpenses(grantId);
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiParam({ name: 'id', description: 'Research expense UUID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.researchExpensesService.findById(id);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create research expense' })
  async create(@Body() dto: CreateResearchExpenseDto, @Req() req: any) {
    const result = await this.researchExpensesService.create(dto, req.user.id);
    return { success: true, data: result, message: 'Expense created' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update research expense' })
  @ApiParam({ name: 'id', description: 'Research expense UUID' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateResearchExpenseDto, @Req() req: any) {
    const result = await this.researchExpensesService.update(id, dto, req.user.id, req.user.role);
    return { success: true, data: result, message: 'Expense updated' };
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit expense for review' })
  @ApiParam({ name: 'id', description: 'Research expense UUID' })
  async submit(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const result = await this.researchExpensesService.submit(id, req.user.id);
    return { success: true, data: result, message: 'Expense submitted' };
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Review expense (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Research expense UUID' })
  async review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewResearchExpenseDto, @Req() req: any) {
    const result = await this.researchExpensesService.review(id, dto.status, dto.rejectionReason, req.user.id);
    return { success: true, data: result, message: `Expense ${dto.status.toLowerCase()}` };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update expense status' })
  @ApiParam({ name: 'id', description: 'Research expense UUID' })
  @ApiQuery({ name: 'status', required: true, type: String })
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Query('status') status: ExpenseStatus, @Req() req: any) {
    const result = await this.researchExpensesService.updateStatus(id, status, req.user.id);
    return { success: true, data: result, message: 'Expense status updated' };
  }
}
