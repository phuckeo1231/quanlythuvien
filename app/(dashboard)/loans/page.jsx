'use client';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import LoanTable  from '@/components/loans/LoanTable.jsx';
import BorrowModal from '@/components/loans/BorrowModal.jsx';
import Pagination  from '@/components/ui/Pagination.jsx';

const GET_LOANS = gql`
  query GetLoans($status: String, $page: Int) {
    loans(status: $status, page: $page, limit: 10) {
      loans {
        id status borrowDate dueDate returnDate fine note
        book   { id title author }
        member { id name email }
      }
      total
    }
  }
`;

const TABS = [
  { value: '',         label: 'Tất cả'    },
  { value: 'active',   label: 'Đang mượn' },
  { value: 'overdue',  label: 'Quá hạn'   },
  { value: 'returned', label: 'Đã trả'    },
];

export default function LoansPage() {
  const [status,      setStatus]      = useState('');
  const [page,        setPage]        = useState(1);
  const [showBorrow,  setShowBorrow]  = useState(false);

  const { data, loading, refetch } = useQuery(GET_LOANS, {
    variables: { status: status || undefined, page },
    fetchPolicy: 'cache-and-network',
  });

  const loans = data?.loans?.loans ?? [];
  const total = data?.loans?.total ?? 0;

  function handleSaved() { setShowBorrow(false); refetch(); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mượn / Trả sách</h1>
          <p className="text-sm text-gray-500 mt-1">{total} phiếu mượn</p>
        </div>
        <button className="btn-primary" onClick={() => setShowBorrow(true)}>+ Tạo phiếu mượn</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.value}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${status === t.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            onClick={() => { setStatus(t.value); setPage(1); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading
          ? <div className="p-12 text-center text-gray-400">Đang tải...</div>
          : <LoanTable loans={loans} onRefetch={refetch} />
        }
        <div className="px-4 pb-4">
          <Pagination page={page} total={total} limit={10} onChange={setPage} />
        </div>
      </div>

      {showBorrow && <BorrowModal onClose={() => setShowBorrow(false)} onSaved={handleSaved} />}
    </div>
  );
}
