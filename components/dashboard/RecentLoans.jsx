'use client';
import { useQuery, gql } from '@apollo/client';
import Badge from '@/components/ui/Badge.jsx';

const GET_RECENT = gql`
  query RecentLoans {
    recentLoans(limit: 8) {
      id status borrowDate dueDate
      book   { title author }
      member { name }
    }
  }
`;

const STATUS_LABEL = { active: 'Đang mượn', returned: 'Đã trả', overdue: 'Quá hạn' };

function fmtDate(d) {
  return new Date(typeof d === 'string' && !d.includes('T') ? Number(d) : d)
    .toLocaleDateString('vi-VN');
}

export default function RecentLoans() {
  const { data, loading } = useQuery(GET_RECENT, { pollInterval: 30000 });
  const loans = data?.recentLoans ?? [];

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Phiếu mượn gần đây</h2>
      </div>
      {loading ? (
        <div className="p-5 space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Chưa có phiếu mượn nào</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {loans.map(l => (
            <div key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{l.book?.title}</p>
                <p className="text-xs text-gray-400">{l.member?.name} · Mượn {fmtDate(l.borrowDate)}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Badge label={STATUS_LABEL[l.status]} variant={l.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
