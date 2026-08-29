import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LaboratoriesService } from './laboratories.service';

@ApiTags('Laboratories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('laboratories')
export class LaboratoriesController {
  constructor(private readonly laboratoriesService: LaboratoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all laboratories' })
  async findAll() {
    return this.laboratoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get laboratory by ID' })
  async findOne(@Param('id') id: string) {
    return this.laboratoriesService.findById(id);
  }
}
