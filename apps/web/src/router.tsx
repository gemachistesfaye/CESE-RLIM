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
import InnovationsList from "./pages/innovations/InnovationsList";
import InnovationDetails from "./pages/innovations/InnovationDetails";

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
    innovationsRoute,
    innovationDetailsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { router };
