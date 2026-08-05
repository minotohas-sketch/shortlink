import { Link, Outlet, useLocation } from 'react-router-dom';
import { HiUser, HiKey } from 'react-icons/hi';

const tabs = [
  { label: 'Profile', href: '/settings/profile', icon: HiUser },
  { label: 'API Keys', href: '/settings/api-keys', icon: HiKey },
];

export default function SettingsPage() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link key={tab.href} to={tab.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
