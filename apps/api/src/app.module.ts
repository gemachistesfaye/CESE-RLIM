import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { ResearchersModule } from './researchers/researchers.module';
import { LaboratoriesModule } from './laboratories/laboratories.module';
import { EquipmentModule } from './equipment/equipment.module';
import { EquipmentRequestsModule } from './equipment-requests/equipment-requests.module';
import { EquipmentAssignmentsModule } from './equipment-assignments/equipment-assignments.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ResearchProjectsModule } from './research-projects/research-projects.module';
import { InnovationsModule } from './innovations/innovations.module';
import { ResearchProjectMembersModule } from './research-project-members/research-project-members.module';
import { ProjectActivitiesModule } from './project-activities/project-activities.module';
import { ResearchDocumentsModule } from './research-documents/research-documents.module';
import { ResearchPublicationsModule } from './research-publications/research-publications.module';
import { FundingOpportunitiesModule } from './funding-opportunities/funding-opportunities.module';
import { GrantApplicationsModule } from './grant-applications/grant-applications.module';
import { ResearchGrantsModule } from './research-grants/research-grants.module';
import { EthicsModule } from './ethics/ethics.module';
import { ResearchEventsModule } from './research-events/research-events.module';
import { EventParticipationsModule } from './event-participations/event-participations.module';
import { BudgetAllocationsModule } from './budget-allocations/budget-allocations.module';
import { ResearchExpensesModule } from './research-expenses/research-expenses.module';
import { ResearchFinanceModule } from './research-finance/research-finance.module';
import { ResearchMilestonesModule } from './research-milestones/research-milestones.module';
import { ResearchReportsModule } from './research-reports/research-reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { GlobalSearchModule } from './global-search/global-search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    AuditModule,
    GlobalSearchModule,
    UsersModule,
    ResearchersModule,
    LaboratoriesModule,
    EquipmentModule,
    EquipmentRequestsModule,
    EquipmentAssignmentsModule,
    MaintenanceModule,
    ResearchProjectsModule,
    InnovationsModule,
    ResearchProjectMembersModule,
    ProjectActivitiesModule,
    ResearchDocumentsModule,
    ResearchPublicationsModule,
    FundingOpportunitiesModule,
    GrantApplicationsModule,
    ResearchGrantsModule,
    EthicsModule,
    ResearchEventsModule,
    EventParticipationsModule,
    BudgetAllocationsModule,
    ResearchExpensesModule,
    ResearchFinanceModule,
    ResearchMilestonesModule,
    ResearchReportsModule,
    DashboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}
