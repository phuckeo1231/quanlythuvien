'use client';
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import Badge from '@/components/ui/Badge.jsx';
import ExtendModal from '@/components/loans/ExtendModal.jsx';

const RETURN_BOOK = gql`
  mutation ReturnBook($loanId: ID!) {
    returnBook(loanId: $loanId) { id status fine returnDate }
  }
`;
const PAY_FINE = gql`
  mutation PayFine($loanId: ID!) {
    payFine(loanId: $loanId) { id finePaid finePaidAt }
  }
`;

const STATUS_LABEL = { active: 'Đang mượn', returned: 'Đã trả', overdue: 'Quá hạn' };
const MAX_EXTENSIONS = 2;

function fmtDate(d) {
  if (!d) return '—';
  return new Date(typeof d === 'string' && !d.includes('T') ? Number(d) : d)
    .toLocaleDateString('vi-VN');
}

export default function LoanTable({ loans, onRefetch }) {
  const [returnBook, { loading }] = useMutation(RETURN_BOOK);
  const [payFine, { loading: payingFine }] = useMutation(PAY_FINE);
  const [extending, setExtending] = useState(null);

  async function handleReturn(loan) {
    if (!confirm(`Xác nhận trả sách "${loan.book.title}"?`)) return;
    try {
      const { data } = await returnBook({ variables: { loanId: loan.id } });
      const fine = data.returnBook.fine;
      if (fine > 0) alert(`Trả sách thành công!\nTiền phạt: ${fine.toLocaleString('vi-VN')}đ`);
      onRefetch();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePayFine(loan) {
    if (!confirm(`Xác nhận đã thu ${loan.fine.toLocaleString('vi-VN')}đ tiền phạt từ "${loan.member?.name ?? 'thành viên này'}"?`)) return;
    try {
      await payFine({ variables: { loanId: loan.id } });
      onRefetch();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!loans.length) {
    return <div className="text-center py-16 text-gray-400">Không có phiếu mượn nào</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Sách</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Thành viên</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Ngày mượn</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Hạn trả</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Trạng thái</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loans.map(l => (
            <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{l.book?.title ?? '—'}</p>
                <p className="text-xs text-gray-400">{l.book?.author}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-gray-700">{l.member?.name ?? '—'}</p>
                <p className="text-xs text-gray-400">{l.member?.email}</p>
              </td>
              <td className="py-3 px-4 text-center text-gray-600">{fmtDate(l.borrowDate)}</td>
              <td className="py-3 px-4 text-center text-gray-600">{fmtDate(l.dueDate)}</td>
              <td className="py-3 px-4 text-center">
                <Badge label={STATUS_LABEL[l.status]} variant={l.status} />
                {l.fine > 0 && (
                  <p className={`text-xs mt-0.5 ${l.finePaid ? 'text-gray-400' : 'text-red-600'}`}>
                    {l.fine.toLocaleString('vi-VN')}đ {l.finePaid ? '(đã thu)' : '(chưa thu)'}
                  </p>
                )}
              </td>
              <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                {(l.status === 'active' || l.status === 'overdue') && (
                  <>
                    {l.extendCount < MAX_EXTENSIONS && (
                      <button
                        onClick={() => setExtending(l)}
                        className="btn-ghost text-xs py-1.5"
                      >
                        Gia hạn
                      </button>
                    )}
                    <button
                      onClick={() => handleReturn(l)}
                      disabled={loading}
                      className="btn-primary text-xs py-1.5"
                    >
                      Trả sách
                    </button>
                  </>
                )}
                {l.status === 'returned' && (
                  <>
                    <span className="text-xs text-gray-400">Trả {fmtDate(l.returnDate)}</span>
                    {l.fine > 0 && !l.finePaid && (
                      <button
                        onClick={() => handlePayFine(l)}
                        disabled={payingFine}
                        className="btn-primary text-xs py-1.5"
                      >
                        Thu phạt
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {extending && (
        <ExtendModal
          loan={extending}
          onClose={() => setExtending(null)}
          onSaved={() => { setExtending(null); onRefetch(); }}
        />
      )}
    </div>
  );
}
