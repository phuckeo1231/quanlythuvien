'use client';
import { useQuery, gql } from '@apollo/client';
import StatsCard from '@/components/ui/StatsCard.jsx';

const GET_STATS = gql`
  query GetStats {
    stats {
      totalBooks totalMembers activeLoans overdueLoans returnedToday totalFines
    }
  }
`;

export default function StatsGrid() {
  const { data, loading } = useQuery(GET_STATS, { pollInterval: 60000 });
  const s = data?.stats;

  if (loading) return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="card p-5 h-24 animate-pulse bg-gray-50" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      <StatsCard icon="📚" label="Tổng đầu sách"    value={s?.totalBooks   ?? 0} color="blue"   />
      <StatsCard icon="👥" label="Thành viên"        value={s?.totalMembers ?? 0} color="purple" />
      <StatsCard icon="🔄" label="Đang mượn"         value={s?.activeLoans  ?? 0} color="green"  />
      <StatsCard icon="⚠️" label="Quá hạn"           value={s?.overdueLoans ?? 0} color="red"    />
      <StatsCard icon="✅" label="Trả hôm nay"       value={s?.returnedToday ?? 0} color="green" />
      <StatsCard
        icon="💰" label="Tổng tiền phạt"
        value={`${(s?.totalFines ?? 0).toLocaleString('vi-VN')}đ`}
        color="orange"
      />
    </div>
  );
}
