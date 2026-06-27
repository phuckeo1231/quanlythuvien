'use client';
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import Modal from '@/components/ui/Modal.jsx';

const EXTEND_LOAN = gql`
  mutation ExtendLoan($loanId: ID!, $newDueDate: String!) {
    extendLoan(loanId: $loanId, newDueDate: $newDueDate) { id dueDate status extendCount }
  }
`;

const MAX_EXTENSIONS = 2;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function ExtendModal({ loan, onClose, onSaved }) {
  const [newDueDate, setNewDueDate] = useState(addDays(loan.dueDate, 7));
  const [error, setError] = useState('');
  const [extendLoan, { loading }] = useMutation(EXTEND_LOAN);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await extendLoan({ variables: { loanId: loan.id, newDueDate } });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  const remaining = MAX_EXTENSIONS - loan.extendCount;

  return (
    <Modal title="Gia hạn mượn sách" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Sách: <strong>{loan.book.title}</strong></p>
          <p className="text-sm text-gray-600">
            Hạn trả hiện tại: <strong>{new Date(loan.dueDate).toLocaleDateString('vi-VN')}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-1">Đã gia hạn {loan.extendCount}/{MAX_EXTENSIONS} lần (còn {remaining} lần)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hạn trả mới *</label>
          <input
            type="date"
            className="input"
            value={newDueDate}
            min={addDays(loan.dueDate, 1)}
            onChange={e => setNewDueDate(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang gia hạn...' : 'Gia hạn'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
