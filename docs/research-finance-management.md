# Research Finance, Budget & Expense Management

## Overview
Complete financial management subsystem for research projects and grants, providing budget allocation, expense tracking, approval workflows, and financial reporting.

## Architecture
Reuses existing `ResearchGrant.awardedAmount` and `ResearchGrant.spentAmount` fields. Adds new models for category-level budget allocations and expense records.

## Database Schema

### New Enums
| Enum | Values |
|------|--------|
| BudgetCategory | PERSONNEL, EQUIPMENT, MATERIALS, TRAVEL, TRAINING, SOFTWARE, LABORATORY, PUBLICATION, CONFERENCE, ADMINISTRATION, OTHER |
| ExpenseStatus | DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED → RECORDED (+ CANCELLED from DRAFT/SUBMITTED) |

### New Models
- **BudgetAllocation** – Category-level budget breakdowns for grants (researchGrantId, category, allocatedAmount)
- **ResearchExpense** – Individual expense records (expenseCode, grant/project, category, amount, vendor, status, approval chain)

### Relationships
- ResearchGrant → BudgetAllocation[] (one-to-many)
- ResearchGrant → ResearchExpense[] (one-to-many)
- ResearchProject → ResearchExpense[] (one-to-many)
- Researcher → ResearchExpense[] (submittedExpenses)
- User → BudgetAllocation[] (createdAllocations)
- User → ResearchExpense[] (approvedExpenses)
- ResearchDocument → ResearchExpense[] (receiptExpenses)

## API Endpoints

### Research Finance (`/research-finance`)
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/summary` | ADMIN, COORDINATOR | Financial summary |
| GET | `/grants/:grantId/summary` | ADMIN, COORDINATOR | Grant financial summary |
| GET | `/projects/:projectId/summary` | ADMIN, COORDINATOR | Project financial summary |

### Budget Allocations (`/budget-allocations`)
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | ADMIN, COORDINATOR | List allocations |
| GET | `/grant/:grantId` | ADMIN, COORDINATOR | Allocations by grant |
| GET | `/grant/:grantId/summary` | ADMIN, COORDINATOR | Category summary |
| GET | `/:id` | ADMIN, COORDINATOR | Allocation details |
| POST | `/` | ADMIN, COORDINATOR | Create allocation |
| PATCH | `/:id` | ADMIN, COORDINATOR | Update allocation |
| DELETE | `/:id` | ADMIN, COORDINATOR | Delete allocation |

### Research Expenses (`/research-expenses`)
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | All (filtered) | List expenses |
| GET | `/my` | All | My expenses |
| GET | `/pending` | ADMIN, COORDINATOR | Pending expenses |
| GET | `/summary` | ADMIN, COORDINATOR | Expense statistics |
| GET | `/grant/:grantId` | All | Expenses by grant |
| GET | `/:id` | All | Expense details |
| POST | `/` | ADMIN, COORDINATOR, RESEARCHER | Create expense |
| PATCH | `/:id` | Owner/ADMIN | Update expense |
| PATCH | `/:id/submit` | Owner | Submit expense |
| PATCH | `/:id/review` | ADMIN, COORDINATOR | Approve/reject |
| PATCH | `/:id/status` | ADMIN, COORDINATOR | Update status |

## Frontend Routes
| Route | Page | Access |
|-------|------|--------|
| `/finance` | Finance Dashboard | ADMIN, COORDINATOR |
| `/research-expenses` | Expenses List | All |
| `/research-expenses/:id` | Expense Details | All |
| `/budget-management` | Budget Management | ADMIN, COORDINATOR |

## Sidebar Navigation
- **FINANCE** section: Finance Dashboard (ADMIN, COORDINATOR), Expenses (All), Budgets (ADMIN, COORDINATOR)

## Budget Lifecycle
```
Grant (awardedAmount)
  → Budget Allocations (category-level)
    → Expenses (submitted against allocation)
      → Review (approve/reject)
        → Approved Spending (increment grant.spentAmount)
          → Remaining Budget = Awarded - Spent
```

## Expense Lifecycle
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → RECORDED
                  ↘ CANCELLED   ↘ REJECTED
```

## Financial Calculations
- **Remaining Budget** = Awarded Amount - Spent Amount
- **Utilization %** = (Spent / Awarded) × 100
- **Category Remaining** = Allocated - Category Spent
- **Over-budget protection**: Prevents approval if expense would exceed grant budget

## Files Created
- `apps/api/src/budget-allocations/` – Backend module
- `apps/api/src/research-expenses/` – Backend module
- `apps/api/src/research-finance/` – Backend module (summaries)
- `apps/web/src/hooks/useResearchFinance.ts` – Frontend hooks
- `apps/web/src/components/research-finance/` – Form components
- `apps/web/src/pages/research-finance/` – Pages
- `docs/research-finance-management.md` – This file
