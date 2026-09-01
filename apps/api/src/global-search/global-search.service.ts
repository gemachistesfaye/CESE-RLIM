import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  status: string | null;
  url: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface SearchSuggestion {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  url: string;
}

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  RESEARCHER: (id) => `/researchers/${id}`,
  LABORATORY: (id) => `/laboratories/${id}`,
  EQUIPMENT: (id) => `/equipment/${id}`,
  PROJECT: (id) => `/research-projects/${id}`,
  INNOVATION: (id) => `/innovations/${id}`,
  PUBLICATION: (id) => `/research-publications/${id}`,
  DOCUMENT: (id) => `/research-documents/${id}`,
  FUNDING: (id) => `/funding-opportunities/${id}`,
  GRANT: (id) => `/grant-applications/${id}`,
  RESEARCH_GRANT: (id) => `/research-grants/${id}`,
  ETHICS: (id) => `/ethics/applications/${id}`,
  EVENT: (id) => `/research-events/${id}`,
  MILESTONE: (id) => `/research-milestones/${id}`,
  REPORT: (id) => `/research-reports/${id}`,
  ACTIVITY: (id) => `/project-activities/${id}`,
};

@Injectable()
export class GlobalSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    q: string;
    page?: number;
    limit?: number;
    type?: string;
    sort?: string;
    userRole: string;
  }): Promise<{ items: SearchResult[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { q, page = 1, limit = 20, type = 'ALL', sort = 'relevance', userRole } = params;
    const skip = (page - 1) * limit;
    const searchTerm = q.trim();

    const typeFilter = type === 'ALL' ? null : type;
    const queries: Promise<SearchResult[]>[] = [];
    const isPrivileged = userRole === 'ADMIN' || userRole === 'COORDINATOR';

    if (!typeFilter || typeFilter === 'RESEARCHER') {
      queries.push(this.searchResearchers(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'LABORATORY') {
      queries.push(this.searchLaboratories(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'EQUIPMENT') {
      queries.push(this.searchEquipment(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'PROJECT') {
      queries.push(this.searchProjects(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'INNOVATION') {
      queries.push(this.searchInnovations(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'PUBLICATION') {
      queries.push(this.searchPublications(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'DOCUMENT') {
      queries.push(this.searchDocuments(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'FUNDING') {
      queries.push(this.searchFundingOpportunities(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'GRANT') {
      queries.push(this.searchGrantApplications(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'RESEARCH_GRANT') {
      queries.push(this.searchResearchGrants(searchTerm, userRole));
    }
    if (isPrivileged && (!typeFilter || typeFilter === 'ETHICS')) {
      queries.push(this.searchEthicsApplications(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'EVENT') {
      queries.push(this.searchEvents(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'MILESTONE') {
      queries.push(this.searchMilestones(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'REPORT') {
      queries.push(this.searchReports(searchTerm, userRole));
    }
    if (!typeFilter || typeFilter === 'ACTIVITY') {
      queries.push(this.searchActivities(searchTerm, userRole));
    }

    const results = await Promise.all(queries);
    let allResults = results.flat();

    if (sort === 'recent') {
      allResults.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = allResults.length;
    const paginatedResults = allResults.slice(skip, skip + limit);

    return {
      items: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async suggestions(params: { q: string; limit?: number; userRole: string }): Promise<SearchSuggestion[]> {
    const { q, limit = 8, userRole } = params;
    const searchTerm = q.trim();
    const perTypeLimit = Math.max(2, Math.ceil(limit / 5));
    const isPrivileged = userRole === 'ADMIN' || userRole === 'COORDINATOR';

    const queries: Promise<SearchSuggestion[]>[] = [
      this.suggestResearchers(searchTerm, perTypeLimit, userRole),
      this.suggestProjects(searchTerm, perTypeLimit, userRole),
      this.suggestEquipment(searchTerm, perTypeLimit, userRole),
      this.suggestPublications(searchTerm, perTypeLimit, userRole),
      this.suggestEvents(searchTerm, perTypeLimit, userRole),
    ];

    const results = await Promise.all(queries);
    const allSuggestions = results.flat();
    return allSuggestions.slice(0, limit);
  }

  private buildSearchCondition(term: string, fields: string[]): Prisma.Sql {
    const pattern = `%${term}%`;
    const conditions = fields.map((field) => Prisma.sql`${Prisma.raw(field)} ILIKE ${pattern}`);
    return Prisma.sql`(${Prisma.join(conditions, ' OR ')})`;
  }

  private async searchResearchers(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, [
      'u."firstName"', 'u."lastName"', 'u."email"',
      'r."employeeOrStudentId"', 'r."department"', 'r."expertise"', 'r."researchAreas"',
    ]);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT r.id, r."employeeOrStudentId", u."firstName", u."lastName", u."email",
             r.department, r.expertise, r."researchAreas", r."createdAt"
      FROM researchers r
      JOIN users u ON r."userId" = u.id
      WHERE u."isActive" = true AND ${where}
      ORDER BY r."createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'RESEARCHER',
      title: `${r.firstName} ${r.lastName}`,
      description: r.expertise || r.researchAreas || r.department || null,
      subtitle: r.employeeOrStudentId,
      status: null,
      url: ENTITY_ROUTES.RESEARCHER(r.id),
      metadata: { email: r.email, department: r.department, employeeOrStudentId: r.employeeOrStudentId },
      createdAt: r.createdAt,
    }));
  }

  private async searchLaboratories(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, [
      'name', 'code', 'location', 'description',
    ]);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, code, location, description, status, "createdAt"
      FROM laboratories
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'LABORATORY',
      title: r.name,
      description: r.description || r.location || null,
      subtitle: r.code,
      status: r.status,
      url: ENTITY_ROUTES.LABORATORY(r.id),
      metadata: { code: r.code, location: r.location },
      createdAt: r.createdAt,
    }));
  }

  private async searchEquipment(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, [
      'e.name', 'e."assetId"', 'e."serialNumber"', 'e.manufacturer', 'e.model', 'e.category',
    ]);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT e.id, e.name, e."assetId", e."serialNumber", e.manufacturer, e.model,
             e.category, e.status, l.name as "labName", e."createdAt"
      FROM equipment e
      LEFT JOIN laboratories l ON e."laboratoryId" = l.id
      WHERE ${where}
      ORDER BY e."createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'EQUIPMENT',
      title: r.name,
      description: [r.manufacturer, r.model].filter(Boolean).join(' - ') || r.category || null,
      subtitle: r.assetId,
      status: r.status,
      url: ENTITY_ROUTES.EQUIPMENT(r.id),
      metadata: { assetId: r.assetId, serialNumber: r.serialNumber, laboratory: r.labName },
      createdAt: r.createdAt,
    }));
  }

  private async searchProjects(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, [
      '"projectCode"', 'title', 'description',
    ]);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, "projectCode", title, description, "projectStatus", "createdAt"
      FROM research_projects
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'PROJECT',
      title: r.title,
      description: r.description || null,
      subtitle: r.projectCode,
      status: r.projectStatus,
      url: ENTITY_ROUTES.PROJECT(r.id),
      metadata: { projectCode: r.projectCode },
      createdAt: r.createdAt,
    }));
  }

  private async searchInnovations(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', 'description', 'category']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, description, category, "developmentStage", status, "createdAt"
      FROM innovations
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'INNOVATION',
      title: r.title,
      description: r.description || null,
      subtitle: r.category || r.developmentStage,
      status: r.status,
      url: ENTITY_ROUTES.INNOVATION(r.id),
      metadata: { category: r.category, developmentStage: r.developmentStage },
      createdAt: r.createdAt,
    }));
  }

  private async searchPublications(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, [
      'title', 'abstract', '"journalName"', 'doi',
    ]);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, abstract, "journalName", doi, "publicationType", status, "createdAt"
      FROM research_publications
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'PUBLICATION',
      title: r.title,
      description: r.abstract ? r.abstract.substring(0, 200) : null,
      subtitle: r.journalName || r.doi || null,
      status: r.status,
      url: ENTITY_ROUTES.PUBLICATION(r.id),
      metadata: { journalName: r.journalName, doi: r.doi, publicationType: r.publicationType },
      createdAt: r.createdAt,
    }));
  }

  private async searchDocuments(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', 'description', '"fileName"']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, description, "fileName", "documentType", status, "createdAt"
      FROM research_documents
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'DOCUMENT',
      title: r.title,
      description: r.description || null,
      subtitle: r.fileName,
      status: r.status,
      url: ENTITY_ROUTES.DOCUMENT(r.id),
      metadata: { fileName: r.fileName, documentType: r.documentType },
      createdAt: r.createdAt,
    }));
  }

  private async searchFundingOpportunities(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', 'organization', 'description']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, organization, description, "fundingType", status, "createdAt"
      FROM funding_opportunities
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'FUNDING',
      title: r.title,
      description: r.description || null,
      subtitle: r.organization,
      status: r.status,
      url: ENTITY_ROUTES.FUNDING(r.id),
      metadata: { organization: r.organization, fundingType: r.fundingType },
      createdAt: r.createdAt,
    }));
  }

  private async searchGrantApplications(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', '"proposalSummary"']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, "proposalSummary", status, "createdAt"
      FROM grant_applications
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'GRANT',
      title: r.title,
      description: r.proposalSummary ? r.proposalSummary.substring(0, 200) : null,
      subtitle: null,
      status: r.status,
      url: ENTITY_ROUTES.GRANT(r.id),
      metadata: {},
      createdAt: r.createdAt,
    }));
  }

  private async searchResearchGrants(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['"grantNumber"', 'notes']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, "grantNumber", notes, status, "createdAt"
      FROM research_grants
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'RESEARCH_GRANT',
      title: r.grantNumber,
      description: r.notes || null,
      subtitle: r.grantNumber,
      status: r.status,
      url: ENTITY_ROUTES.RESEARCH_GRANT(r.id),
      metadata: { grantNumber: r.grantNumber },
      createdAt: r.createdAt,
    }));
  }

  private async searchEthicsApplications(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, [
      '"applicationCode"', 'title', '"researchSummary"',
    ]);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, "applicationCode", title, "researchSummary", status, "createdAt"
      FROM ethics_applications
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'ETHICS',
      title: r.title,
      description: r.researchSummary ? r.researchSummary.substring(0, 200) : null,
      subtitle: r.applicationCode,
      status: r.status,
      url: ENTITY_ROUTES.ETHICS(r.id),
      metadata: { applicationCode: r.applicationCode },
      createdAt: r.createdAt,
    }));
  }

  private async searchEvents(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', 'description', 'location', 'organizer']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, description, location, organizer, status, "eventType", "createdAt"
      FROM research_events
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'EVENT',
      title: r.title,
      description: r.description || null,
      subtitle: r.location || r.organizer || null,
      status: r.status,
      url: ENTITY_ROUTES.EVENT(r.id),
      metadata: { eventType: r.eventType, location: r.location },
      createdAt: r.createdAt,
    }));
  }

  private async searchMilestones(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', 'description']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, description, status, progress, "createdAt"
      FROM research_milestones
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'MILESTONE',
      title: r.title,
      description: r.description || null,
      subtitle: null,
      status: r.status,
      url: ENTITY_ROUTES.MILESTONE(r.id),
      metadata: { progress: r.progress },
      createdAt: r.createdAt,
    }));
  }

  private async searchReports(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', '"executiveSummary"']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, "executiveSummary", status, "reportType", "createdAt"
      FROM research_reports
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'REPORT',
      title: r.title,
      description: r.executiveSummary ? r.executiveSummary.substring(0, 200) : null,
      subtitle: null,
      status: r.status,
      url: ENTITY_ROUTES.REPORT(r.id),
      metadata: { reportType: r.reportType },
      createdAt: r.createdAt,
    }));
  }

  private async searchActivities(term: string, userRole: string): Promise<SearchResult[]> {
    const where = this.buildSearchCondition(term, ['title', 'description']);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, description, status, progress, "createdAt"
      FROM project_activities
      WHERE ${where}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `;

    return results.map((r) => ({
      id: r.id,
      type: 'ACTIVITY',
      title: r.title,
      description: r.description || null,
      subtitle: null,
      status: r.status,
      url: ENTITY_ROUTES.ACTIVITY(r.id),
      metadata: { progress: r.progress },
      createdAt: r.createdAt,
    }));
  }

  private async suggestResearchers(term: string, limit: number, userRole: string): Promise<SearchSuggestion[]> {
    const pattern = `%${term}%`;
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT r.id, u."firstName", u."lastName", r."employeeOrStudentId"
      FROM researchers r
      JOIN users u ON r."userId" = u.id
      WHERE u."isActive" = true AND (
        u."firstName" ILIKE ${pattern} OR u."lastName" ILIKE ${pattern}
        OR r."employeeOrStudentId" ILIKE ${pattern}
      )
      LIMIT ${limit}
    `;
    return results.map((r) => ({
      id: r.id,
      type: 'RESEARCHER',
      title: `${r.firstName} ${r.lastName}`,
      subtitle: r.employeeOrStudentId,
      url: ENTITY_ROUTES.RESEARCHER(r.id),
    }));
  }

  private async suggestProjects(term: string, limit: number, userRole: string): Promise<SearchSuggestion[]> {
    const pattern = `%${term}%`;
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, "projectCode"
      FROM research_projects
      WHERE title ILIKE ${pattern} OR "projectCode" ILIKE ${pattern}
      LIMIT ${limit}
    `;
    return results.map((r) => ({
      id: r.id,
      type: 'PROJECT',
      title: r.title,
      subtitle: r.projectCode,
      url: ENTITY_ROUTES.PROJECT(r.id),
    }));
  }

  private async suggestEquipment(term: string, limit: number, userRole: string): Promise<SearchSuggestion[]> {
    const pattern = `%${term}%`;
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, "assetId"
      FROM equipment
      WHERE name ILIKE ${pattern} OR "assetId" ILIKE ${pattern}
      LIMIT ${limit}
    `;
    return results.map((r) => ({
      id: r.id,
      type: 'EQUIPMENT',
      title: r.name,
      subtitle: r.assetId,
      url: ENTITY_ROUTES.EQUIPMENT(r.id),
    }));
  }

  private async suggestPublications(term: string, limit: number, userRole: string): Promise<SearchSuggestion[]> {
    const pattern = `%${term}%`;
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, "journalName"
      FROM research_publications
      WHERE title ILIKE ${pattern} OR "journalName" ILIKE ${pattern}
      LIMIT ${limit}
    `;
    return results.map((r) => ({
      id: r.id,
      type: 'PUBLICATION',
      title: r.title,
      subtitle: r.journalName,
      url: ENTITY_ROUTES.PUBLICATION(r.id),
    }));
  }

  private async suggestEvents(term: string, limit: number, userRole: string): Promise<SearchSuggestion[]> {
    const pattern = `%${term}%`;
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, location
      FROM research_events
      WHERE title ILIKE ${pattern} OR location ILIKE ${pattern}
      LIMIT ${limit}
    `;
    return results.map((r) => ({
      id: r.id,
      type: 'EVENT',
      title: r.title,
      subtitle: r.location,
      url: ENTITY_ROUTES.EVENT(r.id),
    }));
  }
}
