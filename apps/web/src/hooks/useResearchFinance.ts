import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface BudgetAllocation {
  id: string;
  researchGrantId: string;
  category: string;
  allocatedAmount: number;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  researchGrant: { id: string; grantNumber: string; awardedAmount: number; spentAmount: number };
  createdBy: { id: string; firstName: string; lastName: string };
  expenses: Array<{ id: string; amount: number; status: string }>;
}

export interface ResearchExpense {
  id: string;
  expenseCode: string;
  researchGrantId: string;
  researchProjectId: string | null;
  budgetAllocationId: string | null;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor: string | null;
  referenceNumber: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RECORDED' | 'CANCELLED';
  submittedById: string;
  approvedById: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  receiptDocumentId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  researchGrant: { id: string; grantNumber: string; awardedAmount: number; spentAmount: number };
  researchProject: { id: string; projectCode: string; title: string } | null;
  budgetAllocation: { id: string; category: string; allocatedAmount: number } | null;
  submittedBy: { id: string; userId: string; user: { id: string; firstName: string; lastName: string; email: string } };
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  receiptDocument: { id: string; title: string; fileName: string } | null;
}

export interface PaginatedResponse<T> { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }

export interface FinanceSummary {
  totalGrants: number;
  activeGrants: number;
  totalAwarded: number;
  totalSpent: number;
  remainingBudget: number;
  utilization: number;
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
}

export interface ExpenseSummary {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  recorded: number;
  cancelled: number;
  pendingAmount: number;
  approvedAmount: number;
  totalSpent: number;
  spendingByCategory: Record<string, number>;
}

export interface GrantFinanceSummary {
  grant: { id: string; grantNumber: string; awardedAmount: number; spentAmount: number; status: string; startDate: string; endDate: string; researchProject: { id: string; projectCode: string; title: string } | null; principalInvestigator: { id: string; user: { firstName: string; lastName: string } } | null };
  approvedBudget: number;
  totalAllocated: number;
  totalSpent: number;
  remainingBudget: number;
  utilization: number;
  categoryBreakdown: Array<{ category: string; allocated: number; spent: number; remaining: number; utilization: number }>;
  recentExpenses: Array<{ id: string; expenseCode: string; category: string; description: string; amount: number; expenseDate: string; status: string; submittedBy: { user: { firstName: string; lastName: string } } }>;
  pendingExpenses: number;
}

export interface CategorySummary {
  grantBudget: number;
  totalAllocated: number;
  totalSpent: number;
  remaining: number;
  utilization: number;
  categories: Array<{ category: string; allocated: number; spent: number; remaining: number; utilization: number }>;
}

export const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  PERSONNEL: 'Personnel', EQUIPMENT: 'Equipment', MATERIALS: 'Materials',
  TRAVEL: 'Travel', TRAINING: 'Training', SOFTWARE: 'Software',
  LABORATORY: 'Laboratory', PUBLICATION: 'Publication', CONFERENCE: 'Conference',
  ADMINISTRATION: 'Administration', OTHER: 'Other',
};

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved', REJECTED: 'Rejected', RECORDED: 'Recorded', CANCELLED: 'Cancelled',
};

// Finance Summary
export function useFinanceSummary() {
  return useQuery({
    queryKey: ['financeSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: FinanceSummary }>('/research-finance/summary');
      return data.data;
    },
  });
}

export function useGrantFinanceSummary(grantId: string) {
  return useQuery({
    queryKey: ['grantFinanceSummary', grantId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: GrantFinanceSummary }>(`/research-finance/grants/${grantId}/summary`);
      return data.data;
    },
    enabled: !!grantId,
  });
}

export function useProjectFinanceSummary(projectId: string) {
  return useQuery({
    queryKey: ['projectFinanceSummary', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: { totalGrants: number; totalFunding: number; totalSpent: number; remainingBudget: number; utilization: number; grants: Array<{ id: string; grantNumber: string; awardedAmount: number; spentAmount: number; status: string }> } }>(`/research-finance/projects/${projectId}/summary`);
      return data.data;
    },
    enabled: !!projectId,
  });
}

// Budget Allocations
export function useBudgetAllocations(params: { page: number; limit: number; researchGrantId?: string; category?: string }) {
  return useQuery({
    queryKey: ['budgetAllocations', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<BudgetAllocation> }>('/budget-allocations', { params });
      return data.data;
    },
  });
}

export function useBudgetAllocationsByGrant(grantId: string) {
  return useQuery({
    queryKey: ['budgetAllocations', 'byGrant', grantId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: BudgetAllocation[] }>(`/budget-allocations/grant/${grantId}`);
      return data.data;
    },
    enabled: !!grantId,
  });
}

export function useCategorySummary(grantId: string) {
  return useQuery({
    queryKey: ['categorySummary', grantId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: CategorySummary }>(`/budget-allocations/grant/${grantId}/summary`);
      return data.data;
    },
    enabled: !!grantId,
  });
}

export function useCreateBudgetAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { researchGrantId: string; category: string; allocatedAmount: string; description?: string }) => {
      const { data } = await apiClient.post<{ success: boolean; data: BudgetAllocation }>('/budget-allocations', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgetAllocations'] }); qc.invalidateQueries({ queryKey: ['categorySummary'] }); },
  });
}

export function useUpdateBudgetAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; category?: string; allocatedAmount?: string; description?: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: BudgetAllocation }>(`/budget-allocations/${id}`, payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgetAllocations'] }); qc.invalidateQueries({ queryKey: ['categorySummary'] }); },
  });
}

export function useDeleteBudgetAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ success: boolean; data: { message: string } }>(`/budget-allocations/${id}`);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgetAllocations'] }); qc.invalidateQueries({ queryKey: ['categorySummary'] }); },
  });
}

// Expenses
export function useResearchExpenses(params: {
  page: number; limit: number; search?: string; status?: string; category?: string;
  researchGrantId?: string; researchProjectId?: string; startDate?: string;
  endDate?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchExpenses', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchExpense> }>('/research-expenses', { params });
      return data.data;
    },
  });
}

export function useMyExpenses(params: { page: number; limit: number; status?: string }) {
  return useQuery({
    queryKey: ['myExpenses', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchExpense> }>('/research-expenses/my', { params });
      return data.data;
    },
  });
}

export function usePendingExpenses(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: ['pendingExpenses', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchExpense> }>('/research-expenses/pending', { params });
      return data.data;
    },
  });
}

export function useExpenseSummary() {
  return useQuery({
    queryKey: ['expenseSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ExpenseSummary }>('/research-expenses/summary');
      return data.data;
    },
  });
}

export function useResearchExpense(id: string) {
  return useQuery({
    queryKey: ['researchExpenses', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchExpense }>(`/research-expenses/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useGrantExpenses(grantId: string) {
  return useQuery({
    queryKey: ['researchExpenses', 'byGrant', grantId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchExpense[] }>(`/research-expenses/grant/${grantId}`);
      return data.data;
    },
    enabled: !!grantId,
  });
}

export function useCreateResearchExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      researchGrantId: string; researchProjectId?: string; budgetAllocationId?: string;
      category: string; description: string; amount: string; expenseDate: string;
      vendor?: string; referenceNumber?: string; receiptDocumentId?: string; notes?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ResearchExpense }>('/research-expenses', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['researchExpenses'] }); qc.invalidateQueries({ queryKey: ['expenseSummary'] }); qc.invalidateQueries({ queryKey: ['financeSummary'] }); },
  });
}

export function useUpdateResearchExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: string; budgetAllocationId?: string; category?: string; description?: string;
      amount?: string; expenseDate?: string; vendor?: string; referenceNumber?: string;
      receiptDocumentId?: string; notes?: string;
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchExpense }>(`/research-expenses/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchExpenses'] }); qc.invalidateQueries({ queryKey: ['researchExpenses', vars.id] }); qc.invalidateQueries({ queryKey: ['expenseSummary'] }); },
  });
}

export function useSubmitExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchExpense }>(`/research-expenses/${id}/submit`);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['researchExpenses'] }); qc.invalidateQueries({ queryKey: ['myExpenses'] }); qc.invalidateQueries({ queryKey: ['expenseSummary'] }); },
  });
}

export function useReviewExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchExpense }>(`/research-expenses/${id}/review`, { status, rejectionReason });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchExpenses'] }); qc.invalidateQueries({ queryKey: ['researchExpenses', vars.id] }); qc.invalidateQueries({ queryKey: ['expenseSummary'] }); qc.invalidateQueries({ queryKey: ['financeSummary'] }); },
  });
}

export function useUpdateExpenseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchExpense }>(`/research-expenses/${id}/status?status=${status}`);
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchExpenses'] }); qc.invalidateQueries({ queryKey: ['researchExpenses', vars.id] }); qc.invalidateQueries({ queryKey: ['expenseSummary'] }); },
  });
}
