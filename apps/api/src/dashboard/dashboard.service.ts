import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectStatus,
  LabStatus,
  MaintenanceStatus,
  RequestStatus,
  ExpenseStatus,
  EthicsApplicationStatus,
  EventStatus,
  MilestoneStatus,
  ResearchReportStatus,
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
    const byRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });
    const roleMap: Record<string, number> = {};
    let total = 0;
    let active = 0;
    for (const entry of byRole) {
      roleMap[entry.role] = entry._count.id;
      total += entry._count.id;
    }
    const activeCount = await this.prisma.user.count({ where: { isActive: true } });
    return { total, active: activeCount, byRole: roleMap };
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
    const [totalResult, statusGroups] = await Promise.all([
      this.prisma.equipment.count(),
      this.prisma.equipment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }
    return { total: totalResult, byStatus: statusMap };
  }

  private async getEquipmentRequestStats() {
    const [totalResult, statusGroups] = await Promise.all([
      this.prisma.equipmentRequest.count(),
      this.prisma.equipmentRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }
    const pending = (statusMap['SUBMITTED'] || 0) + (statusMap['UNDER_REVIEW'] || 0);
    return { total: totalResult, byStatus: statusMap, pending };
  }

  private async getMaintenanceStats() {
    const [totalResult, statusGroups, overdue, costResult] = await Promise.all([
      this.prisma.maintenanceRecord.count(),
      this.prisma.maintenanceRecord.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.maintenanceRecord.count({
        where: {
          status: { notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED] },
          reportedAt: { lt: new Date() },
        },
      }),
      this.prisma.maintenanceRecord.aggregate({
        _sum: { cost: true },
        where: { status: MaintenanceStatus.COMPLETED },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }

    return {
      total: totalResult,
      byStatus: statusMap,
      overdue,
      totalCost: Number(costResult._sum.cost || 0),
    };
  }

  private async getProjectStats() {
    const [totalResult, statusGroups] = await Promise.all([
      this.prisma.researchProject.count(),
      this.prisma.researchProject.groupBy({
        by: ['projectStatus'],
        _count: { id: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.projectStatus] = entry._count.id;
    }

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

    return { total: totalResult, byStatus: statusMap, activeProjects: projectProgress };
  }

  private async getProjectActivityStats() {
    const [totalResult, statusGroups, overdue] = await Promise.all([
      this.prisma.projectActivity.count(),
      this.prisma.projectActivity.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.projectActivity.count({
        where: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }

    return {
      total: totalResult,
      todo: statusMap['TODO'] || 0,
      inProgress: statusMap['IN_PROGRESS'] || 0,
      blocked: statusMap['BLOCKED'] || 0,
      completed: statusMap['COMPLETED'] || 0,
      cancelled: statusMap['CANCELLED'] || 0,
      overdue,
    };
  }

  private async getInnovationStats() {
    const [totalResult, statusGroups, stageGroups] = await Promise.all([
      this.prisma.innovation.count(),
      this.prisma.innovation.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.innovation.groupBy({
        by: ['developmentStage'],
        _count: { id: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }
    const stageMap: Record<string, number> = {};
    for (const entry of stageGroups) {
      stageMap[entry.developmentStage] = entry._count.id;
    }

    return { total: totalResult, byStatus: statusMap, byStage: stageMap };
  }

  private async getPublicationStats() {
    const [totalResult, statusGroups, totalCitations] = await Promise.all([
      this.prisma.researchPublication.count(),
      this.prisma.researchPublication.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.researchPublication.aggregate({
        _sum: { citationCount: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }

    return {
      total: totalResult,
      byStatus: statusMap,
      totalCitations: Number(totalCitations._sum.citationCount || 0),
    };
  }

  private async getDocumentStats() {
    const [totalResult, statusGroups, typeGroups] = await Promise.all([
      this.prisma.researchDocument.count(),
      this.prisma.researchDocument.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.researchDocument.groupBy({
        by: ['documentType'],
        _count: { id: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }
    const typeMap: Record<string, number> = {};
    for (const entry of typeGroups) {
      typeMap[entry.documentType] = entry._count.id;
    }

    return { total: totalResult, byStatus: statusMap, byType: typeMap };
  }

  private async getFundingStats() {
    const [totalOpportunitiesResult, oppStatusGroups, totalApplicationsResult, appStatusGroups, totalGrantsResult, grantStatusGroups, awardedAggregate] = await Promise.all([
      this.prisma.fundingOpportunity.count(),
      this.prisma.fundingOpportunity.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.grantApplication.count(),
      this.prisma.grantApplication.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.researchGrant.count(),
      this.prisma.researchGrant.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.researchGrant.aggregate({
        _sum: { awardedAmount: true },
      }),
    ]);

    const oppStatusMap: Record<string, number> = {};
    for (const entry of oppStatusGroups) {
      oppStatusMap[entry.status] = entry._count.id;
    }

    const appStatusMap: Record<string, number> = {};
    for (const entry of appStatusGroups) {
      appStatusMap[entry.status] = entry._count.id;
    }

    const grantStatusMap: Record<string, number> = {};
    for (const entry of grantStatusGroups) {
      grantStatusMap[entry.status] = entry._count.id;
    }

    return {
      opportunities: { total: totalOpportunitiesResult, byStatus: oppStatusMap },
      applications: { total: totalApplicationsResult, byStatus: appStatusMap },
      grants: { total: totalGrantsResult, byStatus: grantStatusMap },
      totalAwarded: Number(awardedAggregate._sum.awardedAmount || 0),
    };
  }

  private async getFinanceStats() {
    const [totalAwarded, totalSpent, totalExpenses, expenseStatusGroups] =
      await Promise.all([
        this.prisma.researchGrant.aggregate({ _sum: { awardedAmount: true } }),
        this.prisma.researchGrant.aggregate({ _sum: { spentAmount: true } }),
        this.prisma.researchExpense.count(),
        this.prisma.researchExpense.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

    const expenseStatusMap: Record<string, number> = {};
    for (const entry of expenseStatusGroups) {
      expenseStatusMap[entry.status] = entry._count.id;
    }

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
    const [totalResult, statusGroups] = await Promise.all([
      this.prisma.ethicsApplication.count(),
      this.prisma.ethicsApplication.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }

    const pendingReview =
      (statusMap['SUBMITTED'] || 0) + (statusMap['RESUBMITTED'] || 0);
    const approved = statusMap['APPROVED'] || 0;
    const rejected = statusMap['REJECTED'] || 0;
    const approvalRate =
      approved + rejected > 0
        ? Math.round((approved / (approved + rejected)) * 100)
        : 0;

    return { total: totalResult, byStatus: statusMap, pendingReview, approvalRate };
  }

  private async getEventStats() {
    const [totalResult, statusGroups, upcoming, upcoming30Days, totalParticipation] = await Promise.all([
      this.prisma.researchEvent.count(),
      this.prisma.researchEvent.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.researchEvent.count({
        where: {
          startDate: { gte: new Date() },
          status: { notIn: [EventStatus.CANCELLED, EventStatus.COMPLETED] },
        },
      }),
      this.prisma.researchEvent.count({
        where: {
          startDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          status: { notIn: [EventStatus.CANCELLED, EventStatus.COMPLETED] },
        },
      }),
      this.prisma.eventParticipation.count(),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }

    return {
      total: totalResult,
      byStatus: statusMap,
      upcoming,
      upcoming30Days,
      totalParticipation,
    };
  }

  private async getMilestoneStats() {
    const [totalResult, statusGroups, overdue, progressAggregate] = await Promise.all([
      this.prisma.researchMilestone.count(),
      this.prisma.researchMilestone.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.researchMilestone.count({
        where: {
          plannedDueDate: { lt: new Date() },
          status: { notIn: [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED] },
        },
      }),
      this.prisma.researchMilestone.aggregate({
        _avg: { progress: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }

    return {
      total: totalResult,
      byStatus: statusMap,
      overdue,
      averageProgress: Math.round(progressAggregate._avg.progress || 0),
    };
  }

  private async getReportStats() {
    const [totalResult, statusGroups] = await Promise.all([
      this.prisma.researchReport.count(),
      this.prisma.researchReport.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);
    const statusMap: Record<string, number> = {};
    for (const entry of statusGroups) {
      statusMap[entry.status] = entry._count.id;
    }

    const awaitingReview =
      (statusMap['SUBMITTED'] || 0) + (statusMap['RESUBMITTED'] || 0);

    return { total: totalResult, byStatus: statusMap, awaitingReview };
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
