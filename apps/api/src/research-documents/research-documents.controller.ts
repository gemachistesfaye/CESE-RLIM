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
import { ResearchDocumentsService } from './research-documents.service';
import { CreateResearchDocumentDto } from './dto/create-research-document.dto';
import { UpdateResearchDocumentDto } from './dto/update-research-document.dto';
import { UploadDocumentVersionDto } from './dto/upload-document-version.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

@ApiTags('Research Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research-documents')
export class ResearchDocumentsController {
  constructor(
    private readonly documentsService: ResearchDocumentsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all research documents with pagination, search, and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'],
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: [
      'PROPOSAL', 'RESEARCH_PLAN', 'PROGRESS_REPORT', 'FINAL_REPORT',
      'TECHNICAL_REPORT', 'DATASET', 'PRESENTATION', 'THESIS',
      'MANUSCRIPT', 'PAPER', 'OTHER',
    ],
  })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiQuery({ name: 'uploadedById', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('documentType') documentType?: string,
    @Query('researchProjectId') researchProjectId?: string,
    @Query('uploadedById') uploadedById?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.documentsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      documentType,
      researchProjectId,
      uploadedById,
      sortBy,
      sortOrder,
      userRole: req.user.role,
      userId: req.user.id,
    });

    return {
      success: true,
      data: result,
      message: 'Documents retrieved successfully',
    };
  }

  @Get('my')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Get documents for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'],
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: [
      'PROPOSAL', 'RESEARCH_PLAN', 'PROGRESS_REPORT', 'FINAL_REPORT',
      'TECHNICAL_REPORT', 'DATASET', 'PRESENTATION', 'THESIS',
      'MANUSCRIPT', 'PAPER', 'OTHER',
    ],
  })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'User documents retrieved successfully' })
  async findMyDocuments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('documentType') documentType?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?: any,
  ) {
    const result = await this.documentsService.getMyDocuments(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      documentType,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
      message: 'User documents retrieved successfully',
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get document summary statistics by status and type' })
  @ApiQuery({ name: 'researchProjectId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Document summary retrieved successfully' })
  async getSummary(@Query('researchProjectId') researchProjectId?: string) {
    const result = await this.documentsService.getSummary(researchProjectId);

    return {
      success: true,
      data: result,
      message: 'Document summary retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get research document by ID' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.documentsService.findById(id);

    return {
      success: true,
      data: result,
      message: 'Document retrieved successfully',
    };
  }

  @Get(':id/versions')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all versions of a research document' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 200, description: 'Document versions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getVersions(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.documentsService.getDocumentVersions(id);

    return {
      success: true,
      data: result,
      message: 'Document versions retrieved successfully',
    };
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get download URL for a research document' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 200, description: 'Download URL retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.documentsService.download(id, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Download URL retrieved successfully',
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new research document' })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Body() dto: CreateResearchDocumentDto,
    @Request() req: any,
  ) {
    const result = await this.documentsService.create(dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Document created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update a research document' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResearchDocumentDto,
    @Request() req: any,
  ) {
    const result = await this.documentsService.update(id, dto, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Document updated successfully',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Update document status' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 200, description: 'Document status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentStatusDto,
    @Request() req: any,
  ) {
    const result = await this.documentsService.updateStatus(id, dto, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Document status updated successfully',
    };
  }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Archive a research document' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 200, description: 'Document archived successfully' })
  @ApiResponse({ status: 400, description: 'Document already archived' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.documentsService.archive(id, req.user.id);

    return {
      success: true,
      data: result,
      message: 'Document archived successfully',
    };
  }

  @Post(':id/versions')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a new version of a research document' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 201, description: 'Document version uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or file validation failed' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async uploadVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadDocumentVersionDto,
    @Request() req: any,
  ) {
    const result = await this.documentsService.uploadVersion(
      id,
      dto,
      req.user.id,
      req.user.role,
    );

    return {
      success: true,
      data: result,
      message: 'Document version uploaded successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.RESEARCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a research document' })
  @ApiParam({ name: 'id', description: 'Research document UUID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete non-draft document' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const result = await this.documentsService.delete(id, req.user.id, req.user.role);

    return {
      success: true,
      data: result,
      message: 'Document deleted successfully',
    };
  }
}
