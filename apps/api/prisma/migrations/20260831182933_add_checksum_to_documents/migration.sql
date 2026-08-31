/*
  Warnings:

  - Added the required column `updated_at` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CONFERENCE', 'SEMINAR', 'WORKSHOP', 'SYMPOSIUM', 'RESEARCH_PRESENTATION', 'EXHIBITION', 'INNOVATION_SHOWCASE', 'TRAINING', 'WEBINAR', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectMemberRole" AS ENUM ('PRINCIPAL_INVESTIGATOR', 'CO_INVESTIGATOR', 'RESEARCHER', 'RESEARCH_ASSISTANT', 'TECHNICAL_MEMBER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PROPOSAL', 'RESEARCH_PLAN', 'PROGRESS_REPORT', 'FINAL_REPORT', 'TECHNICAL_REPORT', 'DATASET', 'PRESENTATION', 'THESIS', 'MANUSCRIPT', 'PAPER', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER', 'THESIS', 'TECHNICAL_REPORT', 'WORKING_PAPER', 'PATENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('INTERNAL', 'NATIONAL', 'INTERNATIONAL', 'INDUSTRY', 'NGO', 'UNIVERSITY', 'OTHER');

-- CreateEnum
CREATE TYPE "FundingOpportunityStatus" AS ENUM ('OPEN', 'CLOSED', 'UPCOMING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GrantApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('PERSONNEL', 'EQUIPMENT', 'MATERIALS', 'TRAVEL', 'TRAINING', 'SOFTWARE', 'LABORATORY', 'PUBLICATION', 'CONFERENCE', 'ADMINISTRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RECORDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'DELAYED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ResearchReportType" AS ENUM ('PROGRESS', 'INTERIM', 'FINAL', 'TECHNICAL', 'FINANCIAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ResearchReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'RESUBMITTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EthicsApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EthicsReviewDecision" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_REVISION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'STATUS_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE 'PROGRESS_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'VERSION_UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'DOWNLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'ARCHIVE';
ALTER TYPE "AuditAction" ADD VALUE 'AUTHOR_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'WITHDRAW';
ALTER TYPE "AuditAction" ADD VALUE 'SPENDING_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMIT';
ALTER TYPE "AuditAction" ADD VALUE 'REQUEST_REVISION';
ALTER TYPE "AuditAction" ADD VALUE 'ASSIGN_REVIEWER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ACTION_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSIGNMENT';
ALTER TYPE "NotificationType" ADD VALUE 'STATUS_CHANGE';
ALTER TYPE "NotificationType" ADD VALUE 'DEADLINE';

-- DropIndex
DROP INDEX "notifications_is_read_idx";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "entity_type" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "research_project_id" TEXT NOT NULL,
    "researcher_id" TEXT NOT NULL,
    "role" "ProjectMemberRole" NOT NULL DEFAULT 'RESEARCHER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activities" (
    "id" TEXT NOT NULL,
    "research_project_id" TEXT NOT NULL,
    "assigned_member_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ActivityStatus" NOT NULL DEFAULT 'TODO',
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_documents" (
    "id" TEXT NOT NULL,
    "research_project_id" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "document_type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "checksum" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "change_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_publications" (
    "id" TEXT NOT NULL,
    "research_project_id" TEXT,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "publication_type" "PublicationType" NOT NULL,
    "journal_name" TEXT,
    "conference_name" TEXT,
    "publisher" TEXT,
    "doi" TEXT,
    "isbn" TEXT,
    "publication_date" TIMESTAMP(3),
    "url" TEXT,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "citation_count" INTEGER DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_authors" (
    "id" TEXT NOT NULL,
    "publication_id" TEXT NOT NULL,
    "researcher_id" TEXT NOT NULL,
    "author_order" INTEGER NOT NULL,
    "is_corresponding_author" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publication_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "description" TEXT,
    "funding_type" "FundingType" NOT NULL,
    "minimum_amount" DECIMAL(14,2),
    "maximum_amount" DECIMAL(14,2),
    "application_deadline" TIMESTAMP(3),
    "eligibility_criteria" TEXT,
    "application_url" TEXT,
    "status" "FundingOpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_applications" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "research_project_id" TEXT,
    "applicant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requestedAmount" DECIMAL(14,2) NOT NULL,
    "proposal_summary" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "review_comment" TEXT,
    "status" "GrantApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grant_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_grants" (
    "id" TEXT NOT NULL,
    "grant_number" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "research_project_id" TEXT,
    "principal_investigator_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "awarded_amount" DECIMAL(14,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "spent_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "GrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ethics_applications" (
    "id" TEXT NOT NULL,
    "application_code" TEXT NOT NULL,
    "research_project_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "research_summary" TEXT NOT NULL,
    "methodology" TEXT,
    "participant_details" TEXT,
    "risk_assessment" TEXT,
    "benefit_statement" TEXT,
    "data_protection_plan" TEXT,
    "consent_process" TEXT,
    "status" "EthicsApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "review_comment" TEXT,
    "revision_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ethics_reviews" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" "EthicsReviewDecision" NOT NULL,
    "comment" TEXT,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ethics_reviewers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_events" (
    "id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "registration_deadline" TIMESTAMP(3),
    "venue" TEXT,
    "location" TEXT,
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "meeting_url" TEXT,
    "organizer" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "max_participants" INTEGER,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "research_project_id" TEXT,
    "innovation_id" TEXT,
    "publication_id" TEXT,
    "objectives" TEXT,
    "eligibility" TEXT,
    "requirements" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "researcher_id" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "attended_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL,
    "research_grant_id" TEXT NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "allocated_amount" DECIMAL(14,2) NOT NULL,
    "description" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_expenses" (
    "id" TEXT NOT NULL,
    "expense_code" TEXT NOT NULL,
    "research_grant_id" TEXT NOT NULL,
    "research_project_id" TEXT,
    "budget_allocation_id" TEXT,
    "category" "BudgetCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "reference_number" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "receipt_document_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_milestones" (
    "id" TEXT NOT NULL,
    "research_project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "milestone_order" INTEGER NOT NULL DEFAULT 0,
    "planned_start_date" TIMESTAMP(3),
    "planned_due_date" TIMESTAMP(3),
    "actual_completion_date" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "responsible_member_id" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_reports" (
    "id" TEXT NOT NULL,
    "report_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "report_type" "ResearchReportType" NOT NULL,
    "research_project_id" TEXT NOT NULL,
    "submitted_by_id" TEXT NOT NULL,
    "reporting_period_start" TIMESTAMP(3),
    "reporting_period_end" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "status" "ResearchReportStatus" NOT NULL DEFAULT 'DRAFT',
    "executive_summary" TEXT,
    "objectives" TEXT,
    "methodology" TEXT,
    "achievements" TEXT,
    "challenges" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "conclusion" TEXT,
    "progress_percentage" INTEGER,
    "next_period_plan" TEXT,
    "reviewer_id" TEXT,
    "review_comment" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_members_research_project_id_idx" ON "project_members"("research_project_id");

-- CreateIndex
CREATE INDEX "project_members_researcher_id_idx" ON "project_members"("researcher_id");

-- CreateIndex
CREATE INDEX "project_members_role_idx" ON "project_members"("role");

-- CreateIndex
CREATE INDEX "project_members_is_active_idx" ON "project_members"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_research_project_id_researcher_id_key" ON "project_members"("research_project_id", "researcher_id");

-- CreateIndex
CREATE INDEX "project_activities_research_project_id_idx" ON "project_activities"("research_project_id");

-- CreateIndex
CREATE INDEX "project_activities_assigned_member_id_idx" ON "project_activities"("assigned_member_id");

-- CreateIndex
CREATE INDEX "project_activities_created_by_id_idx" ON "project_activities"("created_by_id");

-- CreateIndex
CREATE INDEX "project_activities_status_idx" ON "project_activities"("status");

-- CreateIndex
CREATE INDEX "project_activities_priority_idx" ON "project_activities"("priority");

-- CreateIndex
CREATE INDEX "project_activities_due_date_idx" ON "project_activities"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "research_documents_storage_key_key" ON "research_documents"("storage_key");

-- CreateIndex
CREATE INDEX "research_documents_research_project_id_idx" ON "research_documents"("research_project_id");

-- CreateIndex
CREATE INDEX "research_documents_uploaded_by_id_idx" ON "research_documents"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "research_documents_document_type_idx" ON "research_documents"("document_type");

-- CreateIndex
CREATE INDEX "research_documents_status_idx" ON "research_documents"("status");

-- CreateIndex
CREATE INDEX "research_documents_created_at_idx" ON "research_documents"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "research_document_versions_storage_key_key" ON "research_document_versions"("storage_key");

-- CreateIndex
CREATE INDEX "research_document_versions_document_id_idx" ON "research_document_versions"("document_id");

-- CreateIndex
CREATE INDEX "research_document_versions_uploaded_by_id_idx" ON "research_document_versions"("uploaded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "research_document_versions_document_id_version_number_key" ON "research_document_versions"("document_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "research_publications_doi_key" ON "research_publications"("doi");

-- CreateIndex
CREATE INDEX "research_publications_research_project_id_idx" ON "research_publications"("research_project_id");

-- CreateIndex
CREATE INDEX "research_publications_created_by_id_idx" ON "research_publications"("created_by_id");

-- CreateIndex
CREATE INDEX "research_publications_publication_type_idx" ON "research_publications"("publication_type");

-- CreateIndex
CREATE INDEX "research_publications_status_idx" ON "research_publications"("status");

-- CreateIndex
CREATE INDEX "research_publications_doi_idx" ON "research_publications"("doi");

-- CreateIndex
CREATE INDEX "research_publications_created_at_idx" ON "research_publications"("created_at");

-- CreateIndex
CREATE INDEX "publication_authors_publication_id_idx" ON "publication_authors"("publication_id");

-- CreateIndex
CREATE INDEX "publication_authors_researcher_id_idx" ON "publication_authors"("researcher_id");

-- CreateIndex
CREATE UNIQUE INDEX "publication_authors_publication_id_researcher_id_key" ON "publication_authors"("publication_id", "researcher_id");

-- CreateIndex
CREATE INDEX "funding_opportunities_status_idx" ON "funding_opportunities"("status");

-- CreateIndex
CREATE INDEX "funding_opportunities_funding_type_idx" ON "funding_opportunities"("funding_type");

-- CreateIndex
CREATE INDEX "funding_opportunities_application_deadline_idx" ON "funding_opportunities"("application_deadline");

-- CreateIndex
CREATE INDEX "funding_opportunities_created_at_idx" ON "funding_opportunities"("created_at");

-- CreateIndex
CREATE INDEX "grant_applications_opportunity_id_idx" ON "grant_applications"("opportunity_id");

-- CreateIndex
CREATE INDEX "grant_applications_research_project_id_idx" ON "grant_applications"("research_project_id");

-- CreateIndex
CREATE INDEX "grant_applications_applicant_id_idx" ON "grant_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "grant_applications_reviewed_by_id_idx" ON "grant_applications"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "grant_applications_status_idx" ON "grant_applications"("status");

-- CreateIndex
CREATE INDEX "grant_applications_created_at_idx" ON "grant_applications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "research_grants_grant_number_key" ON "research_grants"("grant_number");

-- CreateIndex
CREATE UNIQUE INDEX "research_grants_application_id_key" ON "research_grants"("application_id");

-- CreateIndex
CREATE INDEX "research_grants_grant_number_idx" ON "research_grants"("grant_number");

-- CreateIndex
CREATE INDEX "research_grants_application_id_idx" ON "research_grants"("application_id");

-- CreateIndex
CREATE INDEX "research_grants_research_project_id_idx" ON "research_grants"("research_project_id");

-- CreateIndex
CREATE INDEX "research_grants_principal_investigator_id_idx" ON "research_grants"("principal_investigator_id");

-- CreateIndex
CREATE INDEX "research_grants_created_by_id_idx" ON "research_grants"("created_by_id");

-- CreateIndex
CREATE INDEX "research_grants_status_idx" ON "research_grants"("status");

-- CreateIndex
CREATE INDEX "research_grants_created_at_idx" ON "research_grants"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ethics_applications_application_code_key" ON "ethics_applications"("application_code");

-- CreateIndex
CREATE INDEX "ethics_applications_application_code_idx" ON "ethics_applications"("application_code");

-- CreateIndex
CREATE INDEX "ethics_applications_research_project_id_idx" ON "ethics_applications"("research_project_id");

-- CreateIndex
CREATE INDEX "ethics_applications_applicant_id_idx" ON "ethics_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "ethics_applications_reviewer_id_idx" ON "ethics_applications"("reviewer_id");

-- CreateIndex
CREATE INDEX "ethics_applications_status_idx" ON "ethics_applications"("status");

-- CreateIndex
CREATE INDEX "ethics_applications_created_at_idx" ON "ethics_applications"("created_at");

-- CreateIndex
CREATE INDEX "ethics_reviews_application_id_idx" ON "ethics_reviews"("application_id");

-- CreateIndex
CREATE INDEX "ethics_reviews_reviewer_id_idx" ON "ethics_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "ethics_reviews_decision_idx" ON "ethics_reviews"("decision");

-- CreateIndex
CREATE INDEX "ethics_reviews_created_at_idx" ON "ethics_reviews"("created_at");

-- CreateIndex
CREATE INDEX "ethics_reviewers_application_id_idx" ON "ethics_reviewers"("application_id");

-- CreateIndex
CREATE INDEX "ethics_reviewers_reviewer_id_idx" ON "ethics_reviewers"("reviewer_id");

-- CreateIndex
CREATE INDEX "ethics_reviewers_assigned_by_id_idx" ON "ethics_reviewers"("assigned_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "ethics_reviewers_application_id_reviewer_id_key" ON "ethics_reviewers"("application_id", "reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "research_events_event_code_key" ON "research_events"("event_code");

-- CreateIndex
CREATE INDEX "research_events_event_code_idx" ON "research_events"("event_code");

-- CreateIndex
CREATE INDEX "research_events_event_type_idx" ON "research_events"("event_type");

-- CreateIndex
CREATE INDEX "research_events_status_idx" ON "research_events"("status");

-- CreateIndex
CREATE INDEX "research_events_start_date_idx" ON "research_events"("start_date");

-- CreateIndex
CREATE INDEX "research_events_end_date_idx" ON "research_events"("end_date");

-- CreateIndex
CREATE INDEX "research_events_research_project_id_idx" ON "research_events"("research_project_id");

-- CreateIndex
CREATE INDEX "research_events_innovation_id_idx" ON "research_events"("innovation_id");

-- CreateIndex
CREATE INDEX "research_events_publication_id_idx" ON "research_events"("publication_id");

-- CreateIndex
CREATE INDEX "research_events_created_by_id_idx" ON "research_events"("created_by_id");

-- CreateIndex
CREATE INDEX "research_events_created_at_idx" ON "research_events"("created_at");

-- CreateIndex
CREATE INDEX "event_participations_event_id_idx" ON "event_participations"("event_id");

-- CreateIndex
CREATE INDEX "event_participations_researcher_id_idx" ON "event_participations"("researcher_id");

-- CreateIndex
CREATE INDEX "event_participations_status_idx" ON "event_participations"("status");

-- CreateIndex
CREATE INDEX "event_participations_registered_at_idx" ON "event_participations"("registered_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_participations_event_id_researcher_id_key" ON "event_participations"("event_id", "researcher_id");

-- CreateIndex
CREATE INDEX "budget_allocations_research_grant_id_idx" ON "budget_allocations"("research_grant_id");

-- CreateIndex
CREATE INDEX "budget_allocations_category_idx" ON "budget_allocations"("category");

-- CreateIndex
CREATE INDEX "budget_allocations_created_by_id_idx" ON "budget_allocations"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "research_expenses_expense_code_key" ON "research_expenses"("expense_code");

-- CreateIndex
CREATE INDEX "research_expenses_research_grant_id_idx" ON "research_expenses"("research_grant_id");

-- CreateIndex
CREATE INDEX "research_expenses_research_project_id_idx" ON "research_expenses"("research_project_id");

-- CreateIndex
CREATE INDEX "research_expenses_budget_allocation_id_idx" ON "research_expenses"("budget_allocation_id");

-- CreateIndex
CREATE INDEX "research_expenses_category_idx" ON "research_expenses"("category");

-- CreateIndex
CREATE INDEX "research_expenses_status_idx" ON "research_expenses"("status");

-- CreateIndex
CREATE INDEX "research_expenses_submitted_by_id_idx" ON "research_expenses"("submitted_by_id");

-- CreateIndex
CREATE INDEX "research_expenses_approved_by_id_idx" ON "research_expenses"("approved_by_id");

-- CreateIndex
CREATE INDEX "research_expenses_expense_date_idx" ON "research_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "research_expenses_created_at_idx" ON "research_expenses"("created_at");

-- CreateIndex
CREATE INDEX "research_milestones_research_project_id_idx" ON "research_milestones"("research_project_id");

-- CreateIndex
CREATE INDEX "research_milestones_status_idx" ON "research_milestones"("status");

-- CreateIndex
CREATE INDEX "research_milestones_planned_due_date_idx" ON "research_milestones"("planned_due_date");

-- CreateIndex
CREATE INDEX "research_milestones_responsible_member_id_idx" ON "research_milestones"("responsible_member_id");

-- CreateIndex
CREATE INDEX "research_milestones_created_by_id_idx" ON "research_milestones"("created_by_id");

-- CreateIndex
CREATE INDEX "research_milestones_milestone_order_idx" ON "research_milestones"("milestone_order");

-- CreateIndex
CREATE UNIQUE INDEX "research_reports_report_code_key" ON "research_reports"("report_code");

-- CreateIndex
CREATE INDEX "research_reports_report_code_idx" ON "research_reports"("report_code");

-- CreateIndex
CREATE INDEX "research_reports_research_project_id_idx" ON "research_reports"("research_project_id");

-- CreateIndex
CREATE INDEX "research_reports_submitted_by_id_idx" ON "research_reports"("submitted_by_id");

-- CreateIndex
CREATE INDEX "research_reports_reviewer_id_idx" ON "research_reports"("reviewer_id");

-- CreateIndex
CREATE INDEX "research_reports_status_idx" ON "research_reports"("status");

-- CreateIndex
CREATE INDEX "research_reports_report_type_idx" ON "research_reports"("report_type");

-- CreateIndex
CREATE INDEX "research_reports_created_at_idx" ON "research_reports"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_entity_type_entity_id_idx" ON "notifications"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_researcher_id_fkey" FOREIGN KEY ("researcher_id") REFERENCES "researchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_assigned_member_id_fkey" FOREIGN KEY ("assigned_member_id") REFERENCES "project_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_documents" ADD CONSTRAINT "research_documents_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_documents" ADD CONSTRAINT "research_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_document_versions" ADD CONSTRAINT "research_document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "research_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_document_versions" ADD CONSTRAINT "research_document_versions_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_publications" ADD CONSTRAINT "research_publications_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_publications" ADD CONSTRAINT "research_publications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_authors" ADD CONSTRAINT "publication_authors_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "research_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_authors" ADD CONSTRAINT "publication_authors_researcher_id_fkey" FOREIGN KEY ("researcher_id") REFERENCES "researchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "funding_opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "researchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_grants" ADD CONSTRAINT "research_grants_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "grant_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_grants" ADD CONSTRAINT "research_grants_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_grants" ADD CONSTRAINT "research_grants_principal_investigator_id_fkey" FOREIGN KEY ("principal_investigator_id") REFERENCES "researchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_grants" ADD CONSTRAINT "research_grants_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_applications" ADD CONSTRAINT "ethics_applications_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_applications" ADD CONSTRAINT "ethics_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "researchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_applications" ADD CONSTRAINT "ethics_applications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "researchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_reviews" ADD CONSTRAINT "ethics_reviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "ethics_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_reviews" ADD CONSTRAINT "ethics_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "researchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_reviewers" ADD CONSTRAINT "ethics_reviewers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "ethics_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_reviewers" ADD CONSTRAINT "ethics_reviewers_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "researchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_reviewers" ADD CONSTRAINT "ethics_reviewers_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_events" ADD CONSTRAINT "research_events_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_events" ADD CONSTRAINT "research_events_innovation_id_fkey" FOREIGN KEY ("innovation_id") REFERENCES "innovations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_events" ADD CONSTRAINT "research_events_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "research_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_events" ADD CONSTRAINT "research_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "research_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_researcher_id_fkey" FOREIGN KEY ("researcher_id") REFERENCES "researchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_research_grant_id_fkey" FOREIGN KEY ("research_grant_id") REFERENCES "research_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_expenses" ADD CONSTRAINT "research_expenses_research_grant_id_fkey" FOREIGN KEY ("research_grant_id") REFERENCES "research_grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_expenses" ADD CONSTRAINT "research_expenses_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_expenses" ADD CONSTRAINT "research_expenses_budget_allocation_id_fkey" FOREIGN KEY ("budget_allocation_id") REFERENCES "budget_allocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_expenses" ADD CONSTRAINT "research_expenses_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "researchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_expenses" ADD CONSTRAINT "research_expenses_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_expenses" ADD CONSTRAINT "research_expenses_receipt_document_id_fkey" FOREIGN KEY ("receipt_document_id") REFERENCES "research_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_milestones" ADD CONSTRAINT "research_milestones_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_milestones" ADD CONSTRAINT "research_milestones_responsible_member_id_fkey" FOREIGN KEY ("responsible_member_id") REFERENCES "project_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_milestones" ADD CONSTRAINT "research_milestones_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "researchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
