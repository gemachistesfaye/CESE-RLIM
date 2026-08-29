import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResearchersService } from './researchers.service';

@ApiTags('Researchers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('researchers')
export class ResearchersController {
  constructor(private readonly researchersService: ResearchersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all researchers' })
  async findAll() {
    return this.researchersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get researcher by ID' })
  async findOne(@Param('id') id: string) {
    return this.researchersService.findById(id);
  }
}
