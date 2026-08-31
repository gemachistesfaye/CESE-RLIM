import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./layouts/AppLayout";
import UsersList from "./pages/users/UsersList";
import UserDetails from "./pages/users/UserDetails";
import ResearchersList from "./pages/researchers/ResearchersList";
import ResearcherProfile from "./pages/researchers/ResearcherProfile";
import LaboratoriesList from "./pages/laboratories/LaboratoriesList";
import LaboratoryDetails from "./pages/laboratories/LaboratoryDetails";
import EquipmentList from "./pages/equipment/EquipmentList";
import EquipmentDetails from "./pages/equipment/EquipmentDetails";
import EquipmentRequestsList from "./pages/equipment-requests/EquipmentRequestsList";
import EquipmentRequestDetails from "./pages/equipment-requests/EquipmentRequestDetails";
import EquipmentAssignmentsList from "./pages/equipment-assignments/EquipmentAssignmentsList";
import EquipmentAssignmentDetails from "./pages/equipment-assignments/EquipmentAssignmentDetails";
import MaintenanceList from "./pages/maintenance/MaintenanceList";
import MaintenanceDetails from "./pages/maintenance/MaintenanceDetails";
import MyMaintenance from "./pages/maintenance/MyMaintenance";
import ResearchProjectsList from "./pages/research-projects/ResearchProjectsList";
import ResearchProjectDetails from "./pages/research-projects/ResearchProjectDetails";
import ProjectTeamPage from "./pages/research-projects/ProjectTeamPage";
import InnovationsList from "./pages/innovations/InnovationsList";
import InnovationDetails from "./pages/innovations/InnovationDetails";
import ProjectActivitiesList from "./pages/project-activities/ProjectActivitiesList";
import ProjectActivityDetails from "./pages/project-activities/ProjectActivityDetails";
import ResearchDocumentsList from "./pages/research-documents/ResearchDocumentsList";
import ResearchDocumentDetails from "./pages/research-documents/ResearchDocumentDetails";
import ResearchPublicationsList from "./pages/research-publications/ResearchPublicationsList";
import ResearchPublicationDetails from "./pages/research-publications/ResearchPublicationDetails";
import FundingOpportunitiesList from "./pages/funding-opportunities/FundingOpportunitiesList";
import FundingOpportunityDetails from "./pages/funding-opportunities/FundingOpportunityDetails";
import GrantApplicationsList from "./pages/grant-applications/GrantApplicationsList";
import GrantApplicationDetails from "./pages/grant-applications/GrantApplicationDetails";
import ResearchGrantsList from "./pages/research-grants/ResearchGrantsList";
import ResearchGrantDetails from "./pages/research-grants/ResearchGrantDetails";
import EthicsApplicationsList from "./pages/ethics/EthicsApplicationsList";
import EthicsApplicationDetails from "./pages/ethics/EthicsApplicationDetails";
import ResearchEventsList from "./pages/research-events/ResearchEventsList";
import ResearchEventDetails from "./pages/research-events/ResearchEventDetails";
import MyEvents from "./pages/research-events/MyEvents";
import ResearchFinanceDashboard from "./pages/research-finance/ResearchFinanceDashboard";
import ResearchExpensesList from "./pages/research-finance/ResearchExpensesList";
import ResearchExpenseDetails from "./pages/research-finance/ResearchExpenseDetails";
import BudgetManagement from "./pages/research-finance/BudgetManagement";
import ResearchMilestonesList from "./pages/research-milestones/ResearchMilestonesList";
import ResearchMilestoneDetails from "./pages/research-milestones/ResearchMilestoneDetails";
import MyMilestones from "./pages/research-milestones/MyMilestones";
import ResearchReportsList from "./pages/research-reports/ResearchReportsList";
import ResearchReportDetails from "./pages/research-reports/ResearchReportDetails";
import MyReports from "./pages/research-reports/MyReports";
import NotificationsList from "./pages/notifications/NotificationsList";
import GlobalSearchPage from "./pages/search/GlobalSearchPage";
import AuditLogsList from "./pages/audit-logs/AuditLogsList";
import AuditLogDetails from "./pages/audit-logs/AuditLogDetails";
import AdministrationDashboard from "./pages/administration/AdministrationDashboard";
import SystemSettings from "./pages/administration/SystemSettings";
import RolePermissions from "./pages/administration/RolePermissions";
import SystemInformation from "./pages/administration/SystemInformation";

function RootComponent() {
  return <Outlet />;
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

function requireAuth() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw redirect({ to: "/login" });
  }
}

function requireGuest() {
  const token = localStorage.getItem("accessToken");
  if (token) {
    throw redirect({ to: "/" });
  }
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: requireGuest,
  component: Login,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: requireAuth,
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: Dashboard,
});

const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users",
  component: UsersList,
});

const userDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/$id",
  component: UserDetails,
});

const researchersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/researchers",
  component: ResearchersList,
});

const researcherProfileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/researchers/$id",
  component: ResearcherProfile,
});

const laboratoriesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/laboratories",
  component: LaboratoriesList,
});

const laboratoryDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/laboratories/$id",
  component: LaboratoryDetails,
});

const equipmentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment",
  component: EquipmentList,
});

const equipmentDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment/$id",
  component: EquipmentDetails,
});

const equipmentRequestsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment-requests",
  component: EquipmentRequestsList,
});

const equipmentRequestDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment-requests/$id",
  component: EquipmentRequestDetails,
});

const equipmentAssignmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment-assignments",
  component: EquipmentAssignmentsList,
});

const equipmentAssignmentDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment-assignments/$id",
  component: EquipmentAssignmentDetails,
});

const maintenanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/maintenance",
  component: MaintenanceList,
});

const maintenanceDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/maintenance/$id",
  component: MaintenanceDetails,
});

const myMaintenanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/my-maintenance",
  component: MyMaintenance,
});

const researchProjectsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-projects",
  component: ResearchProjectsList,
});

const researchProjectDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-projects/$id",
  component: ResearchProjectDetails,
});

const projectTeamRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-projects/$projectId/team",
  component: ProjectTeamPage,
});

const innovationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/innovations",
  component: InnovationsList,
});

const innovationDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/innovations/$id",
  component: InnovationDetails,
});

const projectActivitiesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/project-activities",
  component: ProjectActivitiesList,
});

const projectActivityDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/project-activities/$id",
  component: ProjectActivityDetails,
});

const researchDocumentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-documents",
  component: ResearchDocumentsList,
});

const researchDocumentDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-documents/$id",
  component: ResearchDocumentDetails,
});

const researchPublicationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-publications",
  component: ResearchPublicationsList,
});

const researchPublicationDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-publications/$id",
  component: ResearchPublicationDetails,
});

const fundingOpportunitiesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/funding-opportunities",
  component: FundingOpportunitiesList,
});

const fundingOpportunityDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/funding-opportunities/$id",
  component: FundingOpportunityDetails,
});

const grantApplicationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/grant-applications",
  component: GrantApplicationsList,
});

const grantApplicationDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/grant-applications/$id",
  component: GrantApplicationDetails,
});

const researchGrantsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-grants",
  component: ResearchGrantsList,
});

const researchGrantDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-grants/$id",
  component: ResearchGrantDetails,
});

const ethicsApplicationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/ethics/applications",
  component: EthicsApplicationsList,
});

const ethicsApplicationDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/ethics/applications/$id",
  component: EthicsApplicationDetails,
});

const researchEventsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-events",
  component: ResearchEventsList,
});

const researchEventDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-events/$id",
  component: ResearchEventDetails,
});

const myEventsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/my-events",
  component: MyEvents,
});

const financeDashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/finance",
  component: ResearchFinanceDashboard,
});

const researchExpensesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-expenses",
  component: ResearchExpensesList,
});

const researchExpenseDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-expenses/$id",
  component: ResearchExpenseDetails,
});

const budgetManagementRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/budget-management",
  component: BudgetManagement,
});

const researchMilestonesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-milestones",
  component: ResearchMilestonesList,
});

const researchMilestoneDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-milestones/$id",
  component: ResearchMilestoneDetails,
});

const myMilestonesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/my-milestones",
  component: MyMilestones,
});

const researchReportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-reports",
  component: ResearchReportsList,
});

const researchReportDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/research-reports/$id",
  component: ResearchReportDetails,
});

const myReportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/my-reports",
  component: MyReports,
});

const notificationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/notifications",
  component: NotificationsList,
});

const searchRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/search",
  component: GlobalSearchPage,
});

const auditLogsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/audit-logs",
  component: AuditLogsList,
});

const auditLogDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/audit-logs/$id",
  component: AuditLogDetails,
});

const administrationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/administration",
  component: AdministrationDashboard,
});

const systemSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/administration/settings",
  component: SystemSettings,
});

const rolePermissionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/administration/permissions",
  component: RolePermissions,
});

const systemInformationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/administration/system",
  component: SystemInformation,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    dashboardRoute,
    usersRoute,
    userDetailsRoute,
    researchersRoute,
    researcherProfileRoute,
    laboratoriesRoute,
    laboratoryDetailsRoute,
    equipmentRoute,
    equipmentDetailsRoute,
    equipmentRequestsRoute,
    equipmentRequestDetailsRoute,
    equipmentAssignmentsRoute,
    equipmentAssignmentDetailsRoute,
    maintenanceRoute,
    maintenanceDetailsRoute,
    myMaintenanceRoute,
    researchProjectsRoute,
    researchProjectDetailsRoute,
    projectTeamRoute,
    innovationsRoute,
    innovationDetailsRoute,
    projectActivitiesRoute,
    projectActivityDetailsRoute,
    researchDocumentsRoute,
    researchDocumentDetailsRoute,
    researchPublicationsRoute,
    researchPublicationDetailsRoute,
    fundingOpportunitiesRoute,
    fundingOpportunityDetailsRoute,
    grantApplicationsRoute,
    grantApplicationDetailsRoute,
    researchGrantsRoute,
    researchGrantDetailsRoute,
    ethicsApplicationsRoute,
    ethicsApplicationDetailsRoute,
    researchEventsRoute,
    researchEventDetailsRoute,
    myEventsRoute,
    financeDashboardRoute,
    researchExpensesRoute,
    researchExpenseDetailsRoute,
    budgetManagementRoute,
    researchMilestonesRoute,
    researchMilestoneDetailsRoute,
    myMilestonesRoute,
    researchReportsRoute,
    researchReportDetailsRoute,
    myReportsRoute,
    notificationsRoute,
    searchRoute,
    auditLogsRoute,
    auditLogDetailsRoute,
    administrationRoute,
    systemSettingsRoute,
    rolePermissionsRoute,
    systemInformationRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { router };
