import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateResearchDocumentDto } from './dto/create-research-document.dto';
import { UpdateResearchDocumentDto } from './dto/update-research-document.dto';
import { UploadDocumentVersionDto } from './dto/upload-document-version.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import {
  AuditAction,
  DocumentStatus,
  DocumentType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';

const RESEARCH_DOCUMENT_SELECT = {
  id: true,
  researchProjectId: true,
  uploadedById: true,
  title: true,
  description: true,
  documentType: true,
  fileName: true,
  filePath: true,
  storageKey: true,
  mimeType: true,
  fileSize: true,
  version: true,
  status: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  researchProject: {
    select: {
      id: true,
      projectCode: true,
      title: true,
      projectStatus: true,
    },
  },
  uploadedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  versions: {
    select: {
      id: true,
      versionNumber: true,
      fileName: true,
      filePath: true,
      storageKey: true,
      mimeType: true,
      fileSize: true,
      uploadedById: true,
      changeDescription: true,
      createdAt: true,
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { versionNumber: 'desc' as const },
  },
} satisfies Prisma.ResearchDocumentSelect;

const VALID_STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  [DocumentStatus.DRAFT]: [DocumentStatus.SUBMITTED, DocumentStatus.ARCHIVED],
  [DocumentStatus.SUBMITTED]: [DocumentStatus.UNDER_REVIEW, DocumentStatus.ARCHIVED],
  [DocumentStatus.UNDER_REVIEW]: [
    DocumentStatus.APPROVED,
    DocumentStatus.REJECTED,
    DocumentStatus.ARCHIVED,
  ],
  [DocumentStatus.APPROVED]: [DocumentStatus.PUBLISHED, DocumentStatus.ARCHIVED],
  [DocumentStatus.REJECTED]: [DocumentStatus.SUBMITTED, DocumentStatus.ARCHIVED],
  [DocumentStatus.PUBLISHED]: [DocumentStatus.ARCHIVED],
  [DocumentStatus.ARCHIVED]: [],
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/zip',
  'application/x-zip-compressed',
  'text/markdown',
];

@Injectable()
export class ResearchDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private generateStorageKey(originalFileName: string): string {
    const ext = originalFileName.includes('.')
      ? '.' + originalFileName.split('.').pop()
      : '';
    return `research-documents/${randomUUID()}${ext}`;
  }

  private validateFileSize(fileSize: number): void {
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }
  }

  private validateMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `File type "${mimeType}" is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.slice(0, 5).join(', ')}...`,
      );
    }
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    documentType?: string;
    researchProjectId?: string;
    uploadedById?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userRole?: UserRole;
    userId?: string;
  }) {
    const {
      page,
      limit,
      search,
      status,
      documentType,
      researchProjectId,
      uploadedById,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userRole,
      userId,
    } = params;

    const where: Prisma.ResearchDocumentWhereInput = {};

    if (userRole === UserRole.RESEARCHER && userId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (researcher) {
        const projectIds = (
          await this.prisma.projectMember.findMany({
            where: { researcherId: researcher.id },
            select: { researchProjectId: true },
          })
        ).map((m) => m.researchProjectId);
        where.OR = [
          { uploadedById: userId },
          { researchProjectId: { in: projectIds } },
        ];
      }
    }

    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { fileName: { contains: search, mode: 'insensitive' as const } },
          {
            researchProject: {
              title: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            researchProject: {
              projectCode: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            uploadedBy: {
              firstName: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            uploadedBy: {
              lastName: { contains: search, mode: 'insensitive' as const },
            },
          },
        ],
      };
      if (where.AND) {
        const existingAnd = Array.isArray(where.AND) ? where.AND : [where.AND];
        where.AND = [...existingAnd, searchFilter];
      } else {
        where.AND = [searchFilter];
      }
    }

    if (status) {
      where.status = status as DocumentStatus;
    }

    if (documentType) {
      where.documentType = documentType as DocumentType;
    }

    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    if (uploadedById) {
      where.uploadedById = uploadedById;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchDocument.findMany({
        where,
        select: RESEARCH_DOCUMENT_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.researchDocument.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const document = await this.prisma.researchDocument.findUnique({
      where: { id },
      select: RESEARCH_DOCUMENT_SELECT,
    });

    if (!document) {
      throw new NotFoundException('Research document not found');
    }

    return document;
  }

  async getSummary(researchProjectId?: string) {
    const where: Prisma.ResearchDocumentWhereInput = {};
    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    const [
      total,
      draft,
      submitted,
      underReview,
      approved,
      rejected,
      published,
      archived,
    ] = await Promise.all([
      this.prisma.researchDocument.count({ where }),
      this.prisma.researchDocument.count({
        where: { ...where, status: DocumentStatus.DRAFT },
      }),
      this.prisma.researchDocument.count({
        where: { ...where, status: DocumentStatus.SUBMITTED },
      }),
      this.prisma.researchDocument.count({
        where: { ...where, status: DocumentStatus.UNDER_REVIEW },
      }),
      this.prisma.researchDocument.count({
        where: { ...where, status: DocumentStatus.APPROVED },
      }),
      this.prisma.researchDocument.count({
        where: { ...where, status: DocumentStatus.REJECTED },
      }),
      this.prisma.researchDocument.count({
        where: { ...where, status: DocumentStatus.PUBLISHED },
      }),
      this.prisma.researchDocument.count({
        where: { ...where, status: DocumentStatus.ARCHIVED },
      }),
    ]);

    const typeCountsRaw = await this.prisma.researchDocument.groupBy({
      by: ['documentType'],
      where,
      _count: { id: true },
    });

    const byType: Record<string, number> = {};
    for (const entry of typeCountsRaw) {
      byType[entry.documentType] = entry._count.id;
    }

    return {
      total,
      byStatus: {
        draft,
        submitted,
        underReview,
        approved,
        rejected,
        published,
        archived,
      },
      byType,
    };
  }

  async getMyDocuments(userId: string, params: {
    page: number;
    limit: number;
    status?: string;
    documentType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, status, documentType, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const researcher = await this.prisma.researcher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const projectIds = (
      await this.prisma.projectMember.findMany({
        where: { researcherId: researcher.id },
        select: { researchProjectId: true },
      })
    ).map((m) => m.researchProjectId);

    const where: Prisma.ResearchDocumentWhereInput = {
      OR: [
        { uploadedById: userId },
        { researchProjectId: { in: projectIds } },
      ],
    };

    if (status) {
      where.status = status as DocumentStatus;
    }

    if (documentType) {
      where.documentType = documentType as DocumentType;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchDocument.findMany({
        where,
        select: RESEARCH_DOCUMENT_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.researchDocument.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDocumentVersions(documentId: string) {
    const document = await this.prisma.researchDocument.findUnique({
      where: { id: documentId },
      select: { id: true },
    });

    if (!document) {
      throw new NotFoundException('Research document not found');
    }

    const versions = await this.prisma.researchDocumentVersion.findMany({
      where: { documentId },
      select: {
        id: true,
        documentId: true,
        versionNumber: true,
        fileName: true,
        filePath: true,
        storageKey: true,
        mimeType: true,
        fileSize: true,
        uploadedById: true,
        changeDescription: true,
        createdAt: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return versions;
  }

  async download(documentId: string, userId: string, userRole: UserRole) {
    const document = await this.findById(documentId);

    if (userRole === UserRole.RESEARCHER) {
      if (document.uploadedById !== userId) {
        if (!document.researchProjectId) {
          throw new ForbiddenException('You do not have access to this document');
        }
        const researcher = await this.prisma.researcher.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!researcher) {
          throw new ForbiddenException('Researcher profile not found');
        }
        const membership = await this.prisma.projectMember.findUnique({
          where: {
            researchProjectId_researcherId: {
              researchProjectId: document.researchProjectId,
              researcherId: researcher.id,
            },
          },
        });
        if (!membership || !membership.isActive) {
          throw new ForbiddenException('You do not have access to this document');
        }
      }
    }

    await this.auditService.log({
      userId,
      action: AuditAction.DOWNLOAD,
      entityType: 'ResearchDocument',
      entityId: documentId,
      description: `Downloaded document "${document.title}" (version ${document.version})`,
      metadata: {
        researchProjectId: document.researchProjectId,
        version: document.version,
        fileName: document.fileName,
      },
    });

    return {
      url: `/storage/${document.storageKey}`,
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  }

  async create(dto: CreateResearchDocumentDto, userId: string, userRole: UserRole) {
    this.validateFileSize(dto.fileSize);
    this.validateMimeType(dto.mimeType);

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    if (userRole === UserRole.RESEARCHER && dto.researchProjectId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher) {
        throw new ForbiddenException('Researcher profile not found');
      }
      const membership = await this.prisma.projectMember.findUnique({
        where: {
          researchProjectId_researcherId: {
            researchProjectId: dto.researchProjectId,
            researcherId: researcher.id,
          },
        },
      });
      if (!membership || !membership.isActive) {
        throw new ForbiddenException('You are not an active member of this project');
      }
    }

    const storageKey = dto.storageKey || this.generateStorageKey(dto.fileName);

    const existingKey = await this.prisma.researchDocument.findUnique({
      where: { storageKey },
    });
    if (existingKey) {
      throw new BadRequestException('Storage key already exists. Please try again.');
    }

    const document = await this.prisma.researchDocument.create({
      data: {
        researchProjectId: dto.researchProjectId || null,
        uploadedById: userId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        documentType: dto.documentType,
        fileName: dto.fileName.trim(),
        filePath: dto.filePath.trim(),
        storageKey,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        version: 1,
        status: DocumentStatus.DRAFT,
      },
      select: RESEARCH_DOCUMENT_SELECT,
    });

    await this.prisma.researchDocumentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        fileName: dto.fileName.trim(),
        filePath: dto.filePath.trim(),
        storageKey,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        uploadedById: userId,
        changeDescription: 'Initial version',
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ResearchDocument',
      entityId: document.id,
      description: `Created document "${document.title}" (${document.documentType})`,
      metadata: {
        researchProjectId: dto.researchProjectId,
        documentType: document.documentType,
        status: document.status,
        version: 1,
      },
    });

    return document;
  }

  async update(id: string, dto: UpdateResearchDocumentDto, userId: string, userRole: UserRole) {
    const existing = await this.findById(id);

    if (userRole === UserRole.RESEARCHER) {
      if (existing.uploadedById !== userId) {
        throw new ForbiddenException('You can only update documents you uploaded');
      }
      if (existing.status !== DocumentStatus.DRAFT && existing.status !== DocumentStatus.REJECTED) {
        throw new BadRequestException('Only DRAFT or REJECTED documents can be edited');
      }
    }

    if (existing.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('Cannot edit an archived document');
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    if (dto.fileSize) {
      this.validateFileSize(dto.fileSize);
    }
    if (dto.mimeType) {
      this.validateMimeType(dto.mimeType);
    }

    const document = await this.prisma.researchDocument.update({
      where: { id },
      data: {
        researchProjectId: dto.researchProjectId !== undefined ? dto.researchProjectId : undefined,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        documentType: dto.documentType,
        fileName: dto.fileName?.trim(),
        filePath: dto.filePath?.trim(),
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
      },
      select: RESEARCH_DOCUMENT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchDocument',
      entityId: id,
      description: `Updated document "${document.title}"`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        changes: dto,
      },
    });

    return document;
  }

  async updateStatus(id: string, dto: UpdateDocumentStatusDto, userId: string) {
    const existing = await this.findById(id);

    const allowedTransitions = VALID_STATUS_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${dto.status}`,
      );
    }

    const updateData: Prisma.ResearchDocumentUpdateInput = {
      status: dto.status,
    };

    if (dto.status === DocumentStatus.ARCHIVED) {
      updateData.archivedAt = new Date();
    }

    if (existing.status === DocumentStatus.ARCHIVED && dto.status !== DocumentStatus.ARCHIVED) {
      updateData.archivedAt = null;
    }

    const document = await this.prisma.researchDocument.update({
      where: { id },
      data: updateData,
      select: RESEARCH_DOCUMENT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'ResearchDocument',
      entityId: id,
      description: `Changed document "${document.title}" status from ${existing.status} to ${dto.status}`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        previousStatus: existing.status,
        newStatus: dto.status,
      },
    });

    return document;
  }

  async archive(id: string, userId: string) {
    const existing = await this.findById(id);

    if (existing.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('Document is already archived');
    }

    const document = await this.prisma.researchDocument.update({
      where: { id },
      data: {
        status: DocumentStatus.ARCHIVED,
        archivedAt: new Date(),
      },
      select: RESEARCH_DOCUMENT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.ARCHIVE,
      entityType: 'ResearchDocument',
      entityId: id,
      description: `Archived document "${document.title}"`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        previousStatus: existing.status,
      },
    });

    return document;
  }

  async uploadVersion(documentId: string, dto: UploadDocumentVersionDto, userId: string, userRole: UserRole) {
    const document = await this.findById(documentId);

    if (userRole === UserRole.RESEARCHER) {
      if (document.uploadedById !== userId) {
        throw new ForbiddenException('You can only upload versions for documents you uploaded');
      }
    }

    if (document.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('Cannot upload versions for archived documents');
    }

    this.validateFileSize(dto.fileSize);
    this.validateMimeType(dto.mimeType);

    const storageKey = this.generateStorageKey(dto.fileName);

    const nextVersionNumber = document.version + 1;

    const [updatedDocument, newVersion] = await this.prisma.$transaction([
      this.prisma.researchDocument.update({
        where: { id: documentId },
        data: {
          version: nextVersionNumber,
          fileName: dto.fileName.trim(),
          filePath: dto.filePath.trim(),
          storageKey,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
        },
        select: RESEARCH_DOCUMENT_SELECT,
      }),
      this.prisma.researchDocumentVersion.create({
        data: {
          documentId,
          versionNumber: nextVersionNumber,
          fileName: dto.fileName.trim(),
          filePath: dto.filePath.trim(),
          storageKey,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
          uploadedById: userId,
          changeDescription: dto.changeDescription?.trim(),
        },
        select: {
          id: true,
          versionNumber: true,
          fileName: true,
          createdAt: true,
          changeDescription: true,
        },
      }),
    ]);

    await this.auditService.log({
      userId,
      action: AuditAction.VERSION_UPLOAD,
      entityType: 'ResearchDocument',
      entityId: documentId,
      description: `Uploaded version ${nextVersionNumber} of document "${document.title}"`,
      metadata: {
        researchProjectId: document.researchProjectId,
        previousVersion: document.version,
        newVersion: nextVersionNumber,
        fileName: dto.fileName,
      },
    });

    return { document: updatedDocument, version: newVersion };
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const existing = await this.findById(id);

    if (userRole === UserRole.RESEARCHER) {
      if (existing.uploadedById !== userId) {
        throw new ForbiddenException('You can only delete documents you uploaded');
      }
      if (existing.status !== DocumentStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT documents can be deleted');
      }
    }

    if (existing.status !== DocumentStatus.DRAFT && userRole !== UserRole.ADMIN && userRole !== UserRole.COORDINATOR) {
      throw new BadRequestException('Only DRAFT documents can be deleted');
    }

    await this.prisma.researchDocumentVersion.deleteMany({
      where: { documentId: id },
    });

    await this.prisma.researchDocument.delete({
      where: { id },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'ResearchDocument',
      entityId: id,
      description: `Deleted document "${existing.title}"`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        status: existing.status,
        version: existing.version,
      },
    });

    return existing;
  }
}
