import StatsGrid  from '@/components/dashboard/StatsGrid.jsx';
import RecentLoans from '@/components/dashboard/RecentLoans.jsx';

export const metadata = { title: 'Tổng quan — Thư viện' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-1">Thống kê hoạt động thư viện</p>
      </div>
      <StatsGrid />
      <RecentLoans />
    </div>
  );
}
