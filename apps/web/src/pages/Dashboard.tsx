import { useAuth } from '../contexts/AuthContext';
import ResearcherDashboard from '../components/dashboard/ResearcherDashboard';
import TechnicianDashboard from '../components/dashboard/TechnicianDashboard';
import CoordinatorDashboard from '../components/dashboard/CoordinatorDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  switch (user?.role) {
    case 'RESEARCHER':
      return <ResearcherDashboard />;
    case 'TECHNICIAN':
      return <TechnicianDashboard />;
    case 'COORDINATOR':
      return <CoordinatorDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <ResearcherDashboard />;
  }
}
