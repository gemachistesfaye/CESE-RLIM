import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, ExpenseStatus, GrantStatus } from '@prisma/client';

@Injectable()
export class ResearchFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinanceSummary() {
    const [totalGrants, activeGrants, totalAwarded, totalSpent, totalExpenses, pendingExpenses, approvedExpenses, rejectedExpenses] = await Promise.all([
      this.prisma.researchGrant.count(),
      this.prisma.researchGrant.count({ where: { status: GrantStatus.ACTIVE } }),
      this.prisma.researchGrant.aggregate({ _sum: { awardedAmount: true } }),
      this.prisma.researchGrant.aggregate({ _sum: { spentAmount: true } }),
      this.prisma.researchExpense.count(),
      this.prisma.researchExpense.count({ where: { status: { in: [ExpenseStatus.SUBMITTED, ExpenseStatus.UNDER_REVIEW] } } }),
      this.prisma.researchExpense.count({ where: { status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.RECORDED] } } }),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.REJECTED } }),
    ]);

    const awarded = Number(totalAwarded._sum.awardedAmount || 0);
    const spent = Number(totalSpent._sum.spentAmount || 0);

    return {
      totalGrants,
      activeGrants,
      totalAwarded: awarded,
      totalSpent: spent,
      remainingBudget: awarded - spent,
      utilization: awarded > 0 ? Math.round((spent / awarded) * 100 * 100) / 100 : 0,
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
    };
  }

  async getGrantFinanceSummary(grantId: string) {
    const grant = await this.prisma.researchGrant.findUnique({
      where: { id: grantId },
      select: {
        id: true,
        grantNumber: true,
        awardedAmount: true,
        spentAmount: true,
        status: true,
        startDate: true,
        endDate: true,
        researchProject: { select: { id: true, projectCode: true, title: true } },
        principalInvestigator: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!grant) {
      return null;
    }

    const allocations = await this.prisma.budgetAllocation.findMany({
      where: { researchGrantId: grantId },
      select: {
        category: true,
        allocatedAmount: true,
        expenses: {
          select: { amount: true, status: true },
          where: { status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.RECORDED] } },
        },
      },
    });

    const recentExpenses = await this.prisma.researchExpense.findMany({
      where: { researchGrantId: grantId },
      select: {
        id: true,
        expenseCode: true,
        category: true,
        description: true,
        amount: true,
        expenseDate: true,
        status: true,
        submittedBy: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const pendingExpenses = await this.prisma.researchExpense.count({
      where: {
        researchGrantId: grantId,
        status: { in: [ExpenseStatus.SUBMITTED, ExpenseStatus.UNDER_REVIEW] },
      },
    });

    const awarded = Number(grant.awardedAmount);
    const spent = Number(grant.spentAmount);
    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);

    const categoryBreakdown = allocations.map(a => {
      const categorySpent = a.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        category: a.category,
        allocated: Number(a.allocatedAmount),
        spent: categorySpent,
        remaining: Number(a.allocatedAmount) - categorySpent,
        utilization: Number(a.allocatedAmount) > 0 ? Math.round((categorySpent / Number(a.allocatedAmount)) * 100 * 100) / 100 : 0,
      };
    });

    return {
      grant,
      approvedBudget: awarded,
      totalAllocated,
      totalSpent: spent,
      remainingBudget: awarded - spent,
      utilization: awarded > 0 ? Math.round((spent / awarded) * 100 * 100) / 100 : 0,
      categoryBreakdown,
      recentExpenses,
      pendingExpenses,
    };
  }

  async getProjectFinanceSummary(projectId: string) {
    const grants = await this.prisma.researchGrant.findMany({
      where: { researchProjectId: projectId },
      select: {
        id: true,
        grantNumber: true,
        awardedAmount: true,
        spentAmount: true,
        status: true,
        principalInvestigator: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const totalFunding = grants.reduce((sum, g) => sum + Number(g.awardedAmount), 0);
    const totalSpent = grants.reduce((sum, g) => sum + Number(g.spentAmount), 0);

    return {
      totalGrants: grants.length,
      totalFunding,
      totalSpent,
      remainingBudget: totalFunding - totalSpent,
      utilization: totalFunding > 0 ? Math.round((totalSpent / totalFunding) * 100 * 100) / 100 : 0,
      grants,
    };
  }
}
