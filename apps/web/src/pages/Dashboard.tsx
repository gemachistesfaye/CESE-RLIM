import {
  Users,
  FlaskConical,
  Wrench,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

const stats = [
  {
    name: 'Researchers',
    value: '86',
    change: '+3 this month',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    name: 'Laboratories',
    value: '4',
    change: 'All operational',
    icon: FlaskConical,
    color: 'bg-emerald-500',
  },
  {
    name: 'Equipment',
    value: '186',
    change: '94% available',
    icon: Wrench,
    color: 'bg-violet-500',
  },
  {
    name: 'Pending Requests',
    value: '12',
    change: '5 urgent',
    icon: FileText,
    color: 'bg-amber-500',
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'request',
    message: 'Daniel Tesfaye requested Digital Oscilloscope',
    time: '10 minutes ago',
    icon: FileText,
    color: 'text-blue-500',
  },
  {
    id: 2,
    type: 'maintenance',
    message: 'Network Analyzer reported for maintenance',
    time: '2 hours ago',
    icon: AlertTriangle,
    color: 'text-amber-500',
  },
  {
    id: 3,
    type: 'return',
    message: 'Hanna Bekele returned Function Generator',
    time: '4 hours ago',
    icon: CheckCircle,
    color: 'text-emerald-500',
  },
  {
    id: 4,
    type: 'approval',
    message: 'Equipment request approved by Coordinator',
    time: '6 hours ago',
    icon: CheckCircle,
    color: 'text-emerald-500',
  },
  {
    id: 5,
    type: 'new',
    message: 'New researcher profile created: Yonas Girma',
    time: '1 day ago',
    icon: Users,
    color: 'text-violet-500',
  },
];

const labStatus = [
  { name: 'Electronics Laboratory', status: 'Active', equipment: 8, code: 'ELEC-LAB' },
  { name: 'Power & Energy Laboratory', status: 'Active', equipment: 3, code: 'PWR-LAB' },
  { name: 'IoT & Intelligent Systems Laboratory', status: 'Active', equipment: 4, code: 'IOT-LAB' },
  { name: 'Control & Automation Laboratory', status: 'Active', equipment: 1, code: 'CTL-LAB' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of CESE research resources and activities
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <stat.icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
              <Clock size={16} className="text-slate-400" />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <activity.icon size={18} className={activity.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{activity.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Laboratories</h2>
              <TrendingUp size={16} className="text-slate-400" />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {labStatus.map((lab) => (
              <div key={lab.code} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{lab.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{lab.code}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    {lab.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{lab.equipment} equipment items</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Quick Actions</h2>
        <p className="text-sm text-slate-500">
          Additional quick actions and analytics will be available in future updates.
        </p>
      </div>
    </div>
  );
}
