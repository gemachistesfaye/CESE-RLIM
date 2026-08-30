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
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { router };
