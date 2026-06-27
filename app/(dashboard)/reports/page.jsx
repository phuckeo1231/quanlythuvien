'use client';
import { useQuery, gql } from '@apollo/client';
import TopList from '@/components/reports/TopList.jsx';
import MonthlyBarChart from '@/components/reports/MonthlyBarChart.jsx';
import StatsCard from '@/components/ui/StatsCard.jsx';

const GET_REPORTS = gql`
  query GetReports {
    reports {
      topBooks   { count book   { id title author } }
      topMembers { count member { id name email } }
      monthlyLoans { month count }
    }
    stats { totalFines unpaidFines }
  }
`;

export default function ReportsPage() {
  const { data, loading } = useQuery(GET_REPORTS, { fetchPolicy: 'cache-and-network' });
  const reports = data?.reports;
  const stats = data?.stats;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
        <p className="text-sm text-gray-500 mt-1">Phân tích hoạt động mượn trả của thư viện</p>
      </div>

      {loading
        ? <div className="card p-12 text-center text-gray-400">Đang tải...</div>
        : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <StatsCard
                icon="💰" label="Tổng tiền phạt"
                value={`${(stats?.totalFines ?? 0).toLocaleString('vi-VN')}đ`}
                color="orange"
              />
              <StatsCard
                icon="🧾" label="Tiền phạt chưa thu"
                value={`${(stats?.unpaidFines ?? 0).toLocaleString('vi-VN')}đ`}
                color="red"
              />
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Lượt mượn theo tháng (6 tháng gần nhất)</h3>
              <MonthlyBarChart data={reports?.monthlyLoans ?? []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopList
                title="📚 Top 5 sách được mượn nhiều nhất"
                items={reports?.topBooks ?? []}
                renderLabel={item => item.book.title}
                renderSub={item => item.book.author}
              />
              <TopList
                title="👥 Top 5 thành viên mượn nhiều nhất"
                items={reports?.topMembers ?? []}
                renderLabel={item => item.member.name}
                renderSub={item => item.member.email}
              />
            </div>
          </>
        )}
    </div>
  );
}
