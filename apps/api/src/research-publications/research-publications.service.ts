import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateResearchPublicationDto } from './dto/create-research-publication.dto';
import { UpdateResearchPublicationDto } from './dto/update-research-publication.dto';
import { UpdatePublicationStatusDto } from './dto/update-publication-status.dto';
import { ManagePublicationAuthorsDto } from './dto/manage-publication-authors.dto';
import {
  AuditAction,
  PublicationStatus,
  PublicationType,
  Prisma,
  UserRole,
  NotificationType,
} from '@prisma/client';

const PUBLICATION_SELECT = {
  id: true,
  researchProjectId: true,
  title: true,
  abstract: true,
  publicationType: true,
  journalName: true,
  conferenceName: true,
  publisher: true,
  doi: true,
  isbn: true,
  publicationDate: true,
  url: true,
  status: true,
  citationCount: true,
  createdById: true,
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
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  authors: {
    select: {
      id: true,
      publicationId: true,
      researcherId: true,
      authorOrder: true,
      isCorrespondingAuthor: true,
      createdAt: true,
      researcher: {
        select: {
          id: true,
          userId: true,
          employeeOrStudentId: true,
          department: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { authorOrder: 'asc' as const },
  },
} satisfies Prisma.ResearchPublicationSelect;

const VALID_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  [PublicationStatus.DRAFT]: [PublicationStatus.SUBMITTED],
  [PublicationStatus.SUBMITTED]: [PublicationStatus.UNDER_REVIEW],
  [PublicationStatus.UNDER_REVIEW]: [PublicationStatus.ACCEPTED, PublicationStatus.REJECTED],
  [PublicationStatus.ACCEPTED]: [PublicationStatus.PUBLISHED],
  [PublicationStatus.REJECTED]: [PublicationStatus.DRAFT],
  [PublicationStatus.PUBLISHED]: [],
};

@Injectable()
export class ResearchPublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    publicationType?: string;
    researchProjectId?: string;
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
      publicationType,
      researchProjectId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userRole,
      userId,
    } = params;

    const where: Prisma.ResearchPublicationWhereInput = {};

    if (userRole === UserRole.RESEARCHER && userId) {
      where.OR = [
        { createdById: userId },
        { authors: { some: { researcher: { userId } } } },
      ];
    }

    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { abstract: { contains: search, mode: 'insensitive' as const } },
          { journalName: { contains: search, mode: 'insensitive' as const } },
          { conferenceName: { contains: search, mode: 'insensitive' as const } },
          { publisher: { contains: search, mode: 'insensitive' as const } },
          { doi: { contains: search, mode: 'insensitive' as const } },
          { isbn: { contains: search, mode: 'insensitive' as const } },
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
            createdBy: {
              firstName: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            createdBy: {
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
      where.status = status as PublicationStatus;
    }

    if (publicationType) {
      where.publicationType = publicationType as PublicationType;
    }

    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchPublication.findMany({
        where,
        select: PUBLICATION_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.researchPublication.count({ where }),
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
    const publication = await this.prisma.researchPublication.findUnique({
      where: { id },
      select: PUBLICATION_SELECT,
    });

    if (!publication) {
      throw new NotFoundException('Research publication not found');
    }

    return publication;
  }

  async getSummary(researchProjectId?: string) {
    const where: Prisma.ResearchPublicationWhereInput = {};
    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    const [
      total,
      draft,
      submitted,
      underReview,
      accepted,
      published,
      rejected,
    ] = await Promise.all([
      this.prisma.researchPublication.count({ where }),
      this.prisma.researchPublication.count({ where: { ...where, status: PublicationStatus.DRAFT } }),
      this.prisma.researchPublication.count({ where: { ...where, status: PublicationStatus.SUBMITTED } }),
      this.prisma.researchPublication.count({ where: { ...where, status: PublicationStatus.UNDER_REVIEW } }),
      this.prisma.researchPublication.count({ where: { ...where, status: PublicationStatus.ACCEPTED } }),
      this.prisma.researchPublication.count({ where: { ...where, status: PublicationStatus.PUBLISHED } }),
      this.prisma.researchPublication.count({ where: { ...where, status: PublicationStatus.REJECTED } }),
    ]);

    const byType = await this.prisma.researchPublication.groupBy({
      by: ['publicationType'],
      where,
      _count: { id: true },
    });

    const byTypeMap: Record<string, number> = {};
    for (const entry of byType) {
      byTypeMap[entry.publicationType] = entry._count.id;
    }

    const byYear = await this.prisma.$queryRaw<
      Array<{ year: number; count: bigint }>
    >`
      SELECT EXTRACT(YEAR FROM publication_date) AS year, COUNT(*) AS count
      FROM research_publications
      WHERE (${where.researchProjectId ?? null}::text IS NULL OR research_project_id = ${where.researchProjectId ?? ''})
        AND publication_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM publication_date)
      ORDER BY year DESC
    `;

    const byYearMap: Record<number, number> = {};
    for (const entry of byYear) {
      byYearMap[Number(entry.year)] = Number(entry.count);
    }

    return {
      total,
      draft,
      submitted,
      underReview,
      accepted,
      published,
      rejected,
      byType: byTypeMap,
      byYear: byYearMap,
    };
  }

  async getMyPublications(userId: string, params: {
    page: number;
    limit: number;
    status?: string;
    publicationType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, status, publicationType, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const where: Prisma.ResearchPublicationWhereInput = {
      OR: [
        { createdById: userId },
        { authors: { some: { researcher: { userId } } } },
      ],
    };

    if (status) {
      where.status = status as PublicationStatus;
    }

    if (publicationType) {
      where.publicationType = publicationType as PublicationType;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchPublication.findMany({
        where,
        select: PUBLICATION_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.researchPublication.count({ where }),
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

  async create(dto: CreateResearchPublicationDto, userId: string, userRole: UserRole) {
    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });

      if (!project) {
        throw new NotFoundException('Research project not found');
      }

      if (userRole === UserRole.RESEARCHER) {
        const researcher = await this.prisma.researcher.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!researcher) {
          throw new BadRequestException('Researcher profile not found');
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
          throw new BadRequestException('You are not an active member of this project');
        }
      }
    }

    if (dto.doi) {
      const existingDoi = await this.prisma.researchPublication.findUnique({
        where: { doi: dto.doi },
      });
      if (existingDoi) {
        throw new ConflictException('A publication with this DOI already exists');
      }
    }

    const publication = await this.prisma.researchPublication.create({
      data: {
        researchProjectId: dto.researchProjectId || null,
        title: dto.title.trim(),
        abstract: dto.abstract?.trim(),
        publicationType: dto.publicationType,
        journalName: dto.journalName?.trim(),
        conferenceName: dto.conferenceName?.trim(),
        publisher: dto.publisher?.trim(),
        doi: dto.doi?.trim(),
        isbn: dto.isbn?.trim(),
        publicationDate: dto.publicationDate ? new Date(dto.publicationDate) : null,
        url: dto.url?.trim(),
        status: dto.status || PublicationStatus.DRAFT,
        citationCount: dto.citationCount ?? 0,
        createdById: userId,
      },
      select: PUBLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ResearchPublication',
      entityId: publication.id,
      description: `Created publication "${publication.title}"`,
      metadata: {
        researchProjectId: dto.researchProjectId,
        publicationType: publication.publicationType,
        status: publication.status,
        doi: dto.doi,
      },
    });

    return publication;
  }

  async update(id: string, dto: UpdateResearchPublicationDto, userId: string, userRole: UserRole) {
    const existing = await this.findById(id);

    if (userRole === UserRole.RESEARCHER && existing.createdById !== userId) {
      throw new BadRequestException('You can only update publications you created');
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    if (dto.doi && dto.doi !== existing.doi) {
      const existingDoi = await this.prisma.researchPublication.findUnique({
        where: { doi: dto.doi },
      });
      if (existingDoi) {
        throw new ConflictException('A publication with this DOI already exists');
      }
    }

    const publication = await this.prisma.researchPublication.update({
      where: { id },
      data: {
        researchProjectId: dto.researchProjectId !== undefined ? dto.researchProjectId : undefined,
        title: dto.title?.trim(),
        abstract: dto.abstract?.trim(),
        publicationType: dto.publicationType,
        journalName: dto.journalName?.trim(),
        conferenceName: dto.conferenceName?.trim(),
        publisher: dto.publisher?.trim(),
        doi: dto.doi?.trim(),
        isbn: dto.isbn?.trim(),
        publicationDate: dto.publicationDate ? new Date(dto.publicationDate) : undefined,
        url: dto.url?.trim(),
        citationCount: dto.citationCount,
      },
      select: PUBLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchPublication',
      entityId: id,
      description: `Updated publication "${publication.title}"`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        changes: dto,
      },
    });

    return publication;
  }

  async updateStatus(id: string, dto: UpdatePublicationStatusDto, userId: string) {
    const existing = await this.findById(id);

    const allowedTransitions = VALID_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${dto.status}`,
      );
    }

    const publication = await this.prisma.researchPublication.update({
      where: { id },
      data: { status: dto.status },
      select: PUBLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'ResearchPublication',
      entityId: id,
      description: `Changed publication "${publication.title}" status from ${existing.status} to ${dto.status}`,
      metadata: {
        previousStatus: existing.status,
        newStatus: dto.status,
      },
    });

    const authorRecords = await this.prisma.publicationAuthor.findMany({
      where: { publicationId: id },
      select: { researcher: { select: { userId: true } } },
    });
    const authorUserIds = authorRecords
      .map((a) => a.researcher?.userId)
      .filter(Boolean) as string[];
    const uniqueAuthorUserIds = [...new Set(authorUserIds)];

    let pubNotificationType: NotificationType;
    let pubTitle: string;
    let pubMessage: string;

    if (dto.status === PublicationStatus.ACCEPTED) {
      pubNotificationType = NotificationType.SUCCESS;
      pubTitle = 'Publication Accepted';
      pubMessage = `"${existing.title}" has been accepted.`;
    } else if (dto.status === PublicationStatus.REJECTED) {
      pubNotificationType = NotificationType.WARNING;
      pubTitle = 'Publication Rejected';
      pubMessage = `"${existing.title}" has been rejected.`;
    } else if (dto.status === PublicationStatus.PUBLISHED) {
      pubNotificationType = NotificationType.SUCCESS;
      pubTitle = 'Publication Published';
      pubMessage = `"${existing.title}" has been published.`;
    } else {
      return publication;
    }

    const pubNotificationData = uniqueAuthorUserIds.map((uid) => ({
      userId: uid,
      type: pubNotificationType as NotificationType,
      title: pubTitle as string,
      message: pubMessage as string,
      entityType: 'ResearchPublication' as string,
      entityId: id as string,
    }));
    await this.notificationsService.createMany(pubNotificationData);

    return publication;
  }

  async manageAuthors(id: string, dto: ManagePublicationAuthorsDto, userId: string) {
    const existing = await this.findById(id);

    const researcherIds = dto.authors.map((a) => a.researcherId);
    const uniqueResearcherIds = [...new Set(researcherIds)];

    if (uniqueResearcherIds.length !== researcherIds.length) {
      throw new BadRequestException('Duplicate researcher IDs are not allowed');
    }

    const researchers = await this.prisma.researcher.findMany({
      where: { id: { in: uniqueResearcherIds } },
      select: { id: true },
    });

    if (researchers.length !== uniqueResearcherIds.length) {
      const foundIds = new Set(researchers.map((r) => r.id));
      const missingIds = uniqueResearcherIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Researchers not found: ${missingIds.join(', ')}`);
    }

    const authorOrders = dto.authors.map((a) => a.authorOrder);
    const sortedOrders = [...authorOrders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        throw new BadRequestException('Author orders must be consecutive integers starting from 1');
      }
    }

    const correspondingAuthors = dto.authors.filter((a) => a.isCorrespondingAuthor);
    if (correspondingAuthors.length > 1) {
      throw new BadRequestException('Only one corresponding author is allowed');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.publicationAuthor.deleteMany({
        where: { publicationId: id },
      });

      await tx.publicationAuthor.createMany({
        data: dto.authors.map((author) => ({
          publicationId: id,
          researcherId: author.researcherId,
          authorOrder: author.authorOrder,
          isCorrespondingAuthor: author.isCorrespondingAuthor,
        })),
      });
    });

    const updatedPublication = await this.findById(id);

    await this.auditService.log({
      userId,
      action: AuditAction.AUTHOR_UPDATE,
      entityType: 'ResearchPublication',
      entityId: id,
      description: `Updated authors for publication "${existing.title}"`,
      metadata: {
        previousAuthorCount: existing.authors.length,
        newAuthorCount: dto.authors.length,
        authorIds: researcherIds,
      },
    });

    return updatedPublication;
  }

  async remove(id: string, userId: string) {
    const existing = await this.findById(id);

    if (existing.status === PublicationStatus.PUBLISHED) {
      throw new BadRequestException('Cannot delete a published publication. Archive it instead.');
    }

    await this.prisma.researchPublication.delete({
      where: { id },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'ResearchPublication',
      entityId: id,
      description: `Deleted publication "${existing.title}"`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        publicationType: existing.publicationType,
        status: existing.status,
      },
    });

    return existing;
  }
}
