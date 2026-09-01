import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchDto, GlobalSearchSuggestionDto } from './dto/global-search.dto';

@ApiTags('Global Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('global-search')
export class GlobalSearchController {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Search across all platform entities' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Entity type filter' })
  @ApiQuery({ name: 'sort', required: false, enum: ['relevance', 'recent'] })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async search(@Query() dto: GlobalSearchDto, @Request() req: any) {
    const result = await this.globalSearchService.search({
      q: dto.q,
      page: dto.page || 1,
      limit: dto.limit || 20,
      type: dto.type || 'ALL',
      sort: dto.sort || 'relevance',
      userRole: req.user.role,
    });

    return {
      success: true,
      data: result,
      message: 'Search results retrieved successfully',
    };
  }

  @Get('suggestions')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Suggestions returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async suggestions(@Query() dto: GlobalSearchSuggestionDto, @Request() req: any) {
    const result = await this.globalSearchService.suggestions({
      q: dto.q,
      limit: dto.limit || 8,
      userRole: req.user.role,
    });

    return {
      success: true,
      data: result,
      message: 'Suggestions retrieved successfully',
    };
  }
}
