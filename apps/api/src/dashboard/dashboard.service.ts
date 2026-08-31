import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectStatus,
  EquipmentStatus,
  LabStatus,
  MaintenanceStatus,
  RequestStatus,
  InnovationStatus,
  InnovationStage,
  PublicationStatus,
  DocumentStatus,
  GrantApplicationStatus,
  GrantStatus,
  FundingOpportunityStatus,
  EthicsApplicationStatus,
  EventStatus,
  MilestoneStatus,
  ResearchReportStatus,
  ExpenseStatus,
  AuditAction,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      users,
      researchers,
      laboratories,
      equipment,
      equipmentRequests,
      maintenance,
      projects,
      projectActivities,
      innovations,
      publications,
      documents,
      funding,
      finance,
      ethics,
      events,
      milestones,
      reports,
      recentActivity,
      attentionRequired,
    ] = await Promise.all([
      this.getUserStats(),
      this.getResearcherStats(),
      this.getLaboratoryStats(),
      this.getEquipmentStats(),
      this.getEquipmentRequestStats(),
      this.getMaintenanceStats(),
      this.getProjectStats(),
      this.getProjectActivityStats(),
      this.getInnovationStats(),
      this.getPublicationStats(),
      this.getDocumentStats(),
      this.getFundingStats(),
      this.getFinanceStats(),
      this.getEthicsStats(),
      this.getEventStats(),
      this.getMilestoneStats(),
      this.getReportStats(),
      this.getRecentActivity(),
      this.getAttentionRequired(),
    ]);

    return {
      users,
      researchers,
      laboratories,
      equipment,
      equipmentRequests,
      maintenance,
      projects,
      projectActivities,
      innovations,
      publications,
      documents,
      funding,
      finance,
      ethics,
      events,
      milestones,
      reports,
      recentActivity,
      attentionRequired,
    };
  }

  private async getUserStats() {
    const [total, active] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    const byRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });
    const roleMap: Record<string, number> = {};
    for (const entry of byRole) {
      roleMap[entry.role] = entry._count.id;
    }
    return { total, active, byRole: roleMap };
  }

  private async getResearcherStats() {
    const total = await this.prisma.researcher.count();
    return { total };
  }

  private async getLaboratoryStats() {
    const [total, active, inactive, underMaintenance] = await Promise.all([
      this.prisma.laboratory.count(),
      this.prisma.laboratory.count({ where: { status: LabStatus.ACTIVE } }),
      this.prisma.laboratory.count({ where: { status: LabStatus.INACTIVE } }),
      this.prisma.laboratory.count({ where: { status: LabStatus.UNDER_MAINTENANCE } }),
    ]);
    return { total, active, inactive, underMaintenance };
  }

  private async getEquipmentStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.equipment.count(),
      ...Object.values(EquipmentStatus).map((status) =>
        this.prisma.equipment.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(EquipmentStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });
    return { total, byStatus: statusMap };
  }

  private async getEquipmentRequestStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.equipmentRequest.count(),
      ...Object.values(RequestStatus).map((status) =>
        this.prisma.equipmentRequest.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(RequestStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });
    const pending = (statusMap['SUBMITTED'] || 0) + (statusMap['UNDER_REVIEW'] || 0);
    return { total, byStatus: statusMap, pending };
  }

  private async getMaintenanceStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.maintenanceRecord.count(),
      ...Object.values(MaintenanceStatus).map((status) =>
        this.prisma.maintenanceRecord.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(MaintenanceStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const overdue = await this.prisma.maintenanceRecord.count({
      where: {
        status: { notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED] },
        reportedAt: { lt: new Date() },
      },
    });

    const costResult = await this.prisma.maintenanceRecord.aggregate({
      _sum: { cost: true },
      where: { status: MaintenanceStatus.COMPLETED },
    });

    return {
      total,
      byStatus: statusMap,
      overdue,
      totalCost: Number(costResult._sum.cost || 0),
    };
  }

  private async getProjectStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.researchProject.count(),
      ...Object.values(ProjectStatus).map((status) =>
        this.prisma.researchProject.count({ where: { projectStatus: status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(ProjectStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const activeProjects = await this.prisma.researchProject.findMany({
      where: { projectStatus: ProjectStatus.ACTIVE },
      include: {
        projectMembers: { select: { id: true }, where: { isActive: true } },
        projectActivities: { select: { id: true } },
        innovations: { select: { id: true } },
        publications: { select: { id: true } },
        documents: { select: { id: true } },
        milestones: { select: { status: true, progress: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const projectProgress = activeProjects.map((p) => {
      const completedMilestones = p.milestones.filter(
        (m: { status: MilestoneStatus; progress: number }) => m.status === MilestoneStatus.COMPLETED,
      ).length;
      const totalMilestones = p.milestones.length;
      const avgProgress =
        totalMilestones > 0
          ? Math.round(
              p.milestones.reduce(
                (sum: number, m: { status: MilestoneStatus; progress: number }) => sum + m.progress,
                0,
              ) / totalMilestones,
            )
          : 0;

      const isOverdue = p.endDate && new Date(p.endDate) < new Date();

      return {
        id: p.id,
        projectCode: p.projectCode,
        title: p.title,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.projectStatus,
        memberCount: p.projectMembers.length,
        activityCount: p.projectActivities.length,
        innovationCount: p.innovations.length,
        publicationCount: p.publications.length,
        documentCount: p.documents.length,
        milestoneCount: totalMilestones,
        completedMilestones,
        progress: avgProgress,
        isOverdue,
      };
    });

    return { total, byStatus: statusMap, activeProjects: projectProgress };
  }

  private async getProjectActivityStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.projectActivity.count(),
      ...(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'] as const).map(
        (status) => this.prisma.projectActivity.count({ where: { status } }),
      ),
    ]);

    const overdue = await this.prisma.projectActivity.count({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: new Date() },
      },
    });

    return {
      total,
      todo: statusCounts[0],
      inProgress: statusCounts[1],
      blocked: statusCounts[2],
      completed: statusCounts[3],
      cancelled: statusCounts[4],
      overdue,
    };
  }

  private async getInnovationStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.innovation.count(),
      ...Object.values(InnovationStatus).map((status) =>
        this.prisma.innovation.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(InnovationStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const byStage = await this.prisma.innovation.groupBy({
      by: ['developmentStage'],
      _count: { id: true },
    });
    const stageMap: Record<string, number> = {};
    for (const entry of byStage) {
      stageMap[entry.developmentStage] = entry._count.id;
    }

    return { total, byStatus: statusMap, byStage: stageMap };
  }

  private async getPublicationStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.researchPublication.count(),
      ...Object.values(PublicationStatus).map((status) =>
        this.prisma.researchPublication.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(PublicationStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const totalCitations = await this.prisma.researchPublication.aggregate({
      _sum: { citationCount: true },
    });

    return {
      total,
      byStatus: statusMap,
      totalCitations: Number(totalCitations._sum.citationCount || 0),
    };
  }

  private async getDocumentStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.researchDocument.count(),
      ...Object.values(DocumentStatus).map((status) =>
        this.prisma.researchDocument.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(DocumentStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const byType = await this.prisma.researchDocument.groupBy({
      by: ['documentType'],
      _count: { id: true },
    });
    const typeMap: Record<string, number> = {};
    for (const entry of byType) {
      typeMap[entry.documentType] = entry._count.id;
    }

    return { total, byStatus: statusMap, byType: typeMap };
  }

  private async getFundingStats() {
    const [totalOpportunities, ...oppStatusCounts] = await Promise.all([
      this.prisma.fundingOpportunity.count(),
      ...Object.values(FundingOpportunityStatus).map((status) =>
        this.prisma.fundingOpportunity.count({ where: { status } }),
      ),
    ]);
    const oppStatusMap: Record<string, number> = {};
    Object.values(FundingOpportunityStatus).forEach((status, i) => {
      oppStatusMap[status] = oppStatusCounts[i];
    });

    const [totalApplications, ...appStatusCounts] = await Promise.all([
      this.prisma.grantApplication.count(),
      ...Object.values(GrantApplicationStatus).map((status) =>
        this.prisma.grantApplication.count({ where: { status } }),
      ),
    ]);
    const appStatusMap: Record<string, number> = {};
    Object.values(GrantApplicationStatus).forEach((status, i) => {
      appStatusMap[status] = appStatusCounts[i];
    });

    const [totalGrants, ...grantStatusCounts] = await Promise.all([
      this.prisma.researchGrant.count(),
      ...Object.values(GrantStatus).map((status) =>
        this.prisma.researchGrant.count({ where: { status } }),
      ),
    ]);
    const grantStatusMap: Record<string, number> = {};
    Object.values(GrantStatus).forEach((status, i) => {
      grantStatusMap[status] = grantStatusCounts[i];
    });

    const awardedAggregate = await this.prisma.researchGrant.aggregate({
      _sum: { awardedAmount: true },
    });

    return {
      opportunities: { total: totalOpportunities, byStatus: oppStatusMap },
      applications: { total: totalApplications, byStatus: appStatusMap },
      grants: { total: totalGrants, byStatus: grantStatusMap },
      totalAwarded: Number(awardedAggregate._sum.awardedAmount || 0),
    };
  }

  private async getFinanceStats() {
    const [totalAwarded, totalSpent, totalExpenses, ...expenseStatusCounts] =
      await Promise.all([
        this.prisma.researchGrant.aggregate({ _sum: { awardedAmount: true } }),
        this.prisma.researchGrant.aggregate({ _sum: { spentAmount: true } }),
        this.prisma.researchExpense.count(),
        ...Object.values(ExpenseStatus).map((status) =>
          this.prisma.researchExpense.count({ where: { status } }),
        ),
      ]);

    const expenseStatusMap: Record<string, number> = {};
    Object.values(ExpenseStatus).forEach((status, i) => {
      expenseStatusMap[status] = expenseStatusCounts[i];
    });

    const awarded = Number(totalAwarded._sum.awardedAmount || 0);
    const spent = Number(totalSpent._sum.spentAmount || 0);
    const remaining = awarded - spent;
    const utilization = awarded > 0 ? Math.round((spent / awarded) * 100 * 100) / 100 : 0;

    const spendingByCategory = await this.prisma.researchExpense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: { id: true },
      where: { status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.RECORDED] } },
    });

    const categoryBreakdown = spendingByCategory.map((entry) => ({
      category: entry.category,
      amount: Number(entry._sum.amount || 0),
      count: entry._count.id,
    }));

    return {
      totalAwarded: awarded,
      totalSpent: spent,
      remainingBudget: remaining,
      utilization,
      totalExpenses,
      byStatus: expenseStatusMap,
      spendingByCategory: categoryBreakdown,
    };
  }

  private async getEthicsStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.ethicsApplication.count(),
      ...Object.values(EthicsApplicationStatus).map((status) =>
        this.prisma.ethicsApplication.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(EthicsApplicationStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const pendingReview =
      (statusMap['SUBMITTED'] || 0) + (statusMap['RESUBMITTED'] || 0);
    const approved = statusMap['APPROVED'] || 0;
    const rejected = statusMap['REJECTED'] || 0;
    const approvalRate =
      approved + rejected > 0
        ? Math.round((approved / (approved + rejected)) * 100)
        : 0;

    return { total, byStatus: statusMap, pendingReview, approvalRate };
  }

  private async getEventStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.researchEvent.count(),
      ...Object.values(EventStatus).map((status) =>
        this.prisma.researchEvent.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(EventStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const upcoming = await this.prisma.researchEvent.count({
      where: {
        startDate: { gte: new Date() },
        status: { notIn: [EventStatus.CANCELLED, EventStatus.COMPLETED] },
      },
    });

    const upcoming30Days = await this.prisma.researchEvent.count({
      where: {
        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        status: { notIn: [EventStatus.CANCELLED, EventStatus.COMPLETED] },
      },
    });

    const totalParticipation = await this.prisma.eventParticipation.count();

    return {
      total,
      byStatus: statusMap,
      upcoming,
      upcoming30Days,
      totalParticipation,
    };
  }

  private async getMilestoneStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.researchMilestone.count(),
      ...Object.values(MilestoneStatus).map((status) =>
        this.prisma.researchMilestone.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(MilestoneStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const overdue = await this.prisma.researchMilestone.count({
      where: {
        plannedDueDate: { lt: new Date() },
        status: { notIn: [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED] },
      },
    });

    const progressAggregate = await this.prisma.researchMilestone.aggregate({
      _avg: { progress: true },
    });

    return {
      total,
      byStatus: statusMap,
      overdue,
      averageProgress: Math.round(progressAggregate._avg.progress || 0),
    };
  }

  private async getReportStats() {
    const [total, ...statusCounts] = await Promise.all([
      this.prisma.researchReport.count(),
      ...Object.values(ResearchReportStatus).map((status) =>
        this.prisma.researchReport.count({ where: { status } }),
      ),
    ]);
    const statusMap: Record<string, number> = {};
    Object.values(ResearchReportStatus).forEach((status, i) => {
      statusMap[status] = statusCounts[i];
    });

    const awaitingReview =
      (statusMap['SUBMITTED'] || 0) + (statusMap['RESUBMITTED'] || 0);

    return { total, byStatus: statusMap, awaitingReview };
  }

  private async getRecentActivity() {
    const logs = await this.prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      userName: log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : 'System',
      createdAt: log.createdAt,
    }));
  }

  private async getAttentionRequired() {
    const [
      pendingEquipmentRequests,
      overdueMaintenance,
      pendingEthicsReviews,
      overdueMilestones,
      reportsAwaitingReview,
      pendingExpenses,
      projectsApproachingEnd,
    ] = await Promise.all([
      this.prisma.equipmentRequest.count({
        where: {
          status: { in: [RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW] },
        },
      }),
      this.prisma.maintenanceRecord.count({
        where: {
          status: {
            notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
          },
          reportedAt: { lt: new Date() },
        },
      }),
      this.prisma.ethicsApplication.count({
        where: {
          status: {
            in: [
              EthicsApplicationStatus.SUBMITTED,
              EthicsApplicationStatus.RESUBMITTED,
            ],
          },
        },
      }),
      this.prisma.researchMilestone.count({
        where: {
          plannedDueDate: { lt: new Date() },
          status: {
            notIn: [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED],
          },
        },
      }),
      this.prisma.researchReport.count({
        where: {
          status: {
            in: [
              ResearchReportStatus.SUBMITTED,
              ResearchReportStatus.RESUBMITTED,
            ],
          },
        },
      }),
      this.prisma.researchExpense.count({
        where: {
          status: {
            in: [ExpenseStatus.SUBMITTED, ExpenseStatus.UNDER_REVIEW],
          },
        },
      }),
      this.prisma.researchProject.count({
        where: {
          projectStatus: ProjectStatus.ACTIVE,
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      pendingEquipmentRequests,
      overdueMaintenance,
      pendingEthicsReviews,
      overdueMilestones,
      reportsAwaitingReview,
      pendingExpenses,
      projectsApproachingEnd,
    };
  }
}
