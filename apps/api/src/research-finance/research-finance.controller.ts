import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ResearchFinanceService } from './research-finance.service';

@ApiTags('Research Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-finance')
export class ResearchFinanceController {
  constructor(private readonly researchFinanceService: ResearchFinanceService) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get financial summary' })
  async getSummary() {
    const result = await this.researchFinanceService.getFinanceSummary();
    return { success: true, data: result };
  }

  @Get('grants/:grantId/summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get grant financial summary' })
  @ApiParam({ name: 'grantId', description: 'Research grant UUID' })
  async getGrantSummary(@Param('grantId') grantId: string) {
    const result = await this.researchFinanceService.getGrantFinanceSummary(grantId);
    return { success: true, data: result };
  }

  @Get('projects/:projectId/summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get project financial summary' })
  @ApiParam({ name: 'projectId', description: 'Research project UUID' })
  async getProjectSummary(@Param('projectId') projectId: string) {
    const result = await this.researchFinanceService.getProjectFinanceSummary(projectId);
    return { success: true, data: result };
  }
}
