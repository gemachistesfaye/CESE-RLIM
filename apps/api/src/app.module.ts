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
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    AuditModule,
    UsersModule,
    ResearchersModule,
    LaboratoriesModule,
    EquipmentModule,
    EquipmentRequestsModule,
    EquipmentAssignmentsModule,
    MaintenanceModule,
    ResearchProjectsModule,
  ],
})
export class AppModule {}
