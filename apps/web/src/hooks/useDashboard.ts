import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface DashboardOverview {
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  researchers: {
    total: number;
  };
  laboratories: {
    total: number;
    active: number;
    inactive: number;
    underMaintenance: number;
  };
  equipment: {
    total: number;
    byStatus: Record<string, number>;
  };
  equipmentRequests: {
    total: number;
    byStatus: Record<string, number>;
    pending: number;
  };
  maintenance: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    totalCost: number;
  };
  projects: {
    total: number;
    byStatus: Record<string, number>;
    activeProjects: Array<{
      id: string;
      projectCode: string;
      title: string;
      startDate: string | null;
      endDate: string | null;
      status: string;
      memberCount: number;
      activityCount: number;
      innovationCount: number;
      publicationCount: number;
      documentCount: number;
      milestoneCount: number;
      completedMilestones: number;
      progress: number;
      isOverdue: boolean;
    }>;
  };
  projectActivities: {
    total: number;
    todo: number;
    inProgress: number;
    blocked: number;
    completed: number;
    cancelled: number;
    overdue: number;
  };
  innovations: {
    total: number;
    byStatus: Record<string, number>;
    byStage: Record<string, number>;
  };
  publications: {
    total: number;
    byStatus: Record<string, number>;
    totalCitations: number;
  };
  documents: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  funding: {
    opportunities: { total: number; byStatus: Record<string, number> };
    applications: { total: number; byStatus: Record<string, number> };
    grants: { total: number; byStatus: Record<string, number> };
    totalAwarded: number;
  };
  finance: {
    totalAwarded: number;
    totalSpent: number;
    remainingBudget: number;
    utilization: number;
    totalExpenses: number;
    byStatus: Record<string, number>;
    spendingByCategory: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
  };
  ethics: {
    total: number;
    byStatus: Record<string, number>;
    pendingReview: number;
    approvalRate: number;
  };
  events: {
    total: number;
    byStatus: Record<string, number>;
    upcoming: number;
    upcoming30Days: number;
    totalParticipation: number;
  };
  milestones: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    averageProgress: number;
  };
  reports: {
    total: number;
    byStatus: Record<string, number>;
    awaitingReview: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    description: string | null;
    userName: string;
    createdAt: string;
  }>;
  attentionRequired: {
    pendingEquipmentRequests: number;
    overdueMaintenance: number;
    pendingEthicsReviews: number;
    overdueMilestones: number;
    reportsAwaitingReview: number;
    pendingExpenses: number;
    projectsApproachingEnd: number;
  };
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DashboardOverview }>(
        '/dashboard/overview',
      );
      return data.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
