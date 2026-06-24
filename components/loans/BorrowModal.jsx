'use client';
import { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import Modal from '@/components/ui/Modal.jsx';

const BORROW_BOOK = gql`
  mutation BorrowBook($bookId: ID!, $memberId: ID!, $dueDate: String!, $note: String) {
    borrowBook(bookId: $bookId, memberId: $memberId, dueDate: $dueDate, note: $note) { id }
  }
`;
const GET_BOOKS = gql`
  query GetBooks($search: String) {
    books(search: $search, limit: 20) {
      books { id title author available }
    }
  }
`;
const GET_MEMBERS = gql`
  query GetMembers($search: String) {
    members(search: $search, limit: 20) {
      members { id name email status }
    }
  }
`;

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

export default function BorrowModal({ onClose, onSaved }) {
  const [bookSearch,   setBookSearch]   = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedBook,   setSelectedBook]   = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [note,    setNote]    = useState('');
  const [error,   setError]   = useState('');

  const { data: booksData }   = useQuery(GET_BOOKS,   { variables: { search: bookSearch   || undefined } });
  const { data: membersData } = useQuery(GET_MEMBERS, { variables: { search: memberSearch || undefined } });
  const [borrowBook, { loading }] = useMutation(BORROW_BOOK);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedBook)   return setError('Vui lòng chọn sách');
    if (!selectedMember) return setError('Vui lòng chọn thành viên');
    setError('');
    try {
      await borrowBook({ variables: { bookId: selectedBook.id, memberId: selectedMember.id, dueDate, note } });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  const books   = booksData?.books?.books   ?? [];
  const members = membersData?.members?.members ?? [];

  return (
    <Modal title="Tạo phiếu mượn sách" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Chọn sách */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tìm sách *</label>
          <input className="input mb-2" placeholder="Tên sách, tác giả..." value={bookSearch} onChange={e => setBookSearch(e.target.value)} />
          <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {books.filter(b => b.available > 0).map(b => (
              <button
                key={b.id} type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between
                  ${selectedBook?.id === b.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                onClick={() => setSelectedBook(b)}
              >
                <span>{b.title} — {b.author}</span>
                <span className="text-green-600 text-xs">Còn {b.available}</span>
              </button>
            ))}
            {books.filter(b => b.available > 0).length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm">Không tìm thấy sách còn trong kho</p>
            )}
          </div>
          {selectedBook && (
            <p className="text-sm text-blue-700 mt-1.5">✓ Đã chọn: <strong>{selectedBook.title}</strong></p>
          )}
        </div>

        {/* Chọn thành viên */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tìm thành viên *</label>
          <input className="input mb-2" placeholder="Tên, email..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
          <div className="border border-gray-200 rounded-lg max-h-36 overflow-y-auto">
            {members.filter(m => m.status === 'active').map(m => (
              <button
                key={m.id} type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50
                  ${selectedMember?.id === m.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                onClick={() => setSelectedMember(m)}
              >
                {m.name} — {m.email}
              </button>
            ))}
          </div>
          {selectedMember && (
            <p className="text-sm text-blue-700 mt-1.5">✓ Đã chọn: <strong>{selectedMember.name}</strong></p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hạn trả *</label>
            <input type="date" className="input" value={dueDate} min={new Date().toISOString().split('T')[0]} onChange={e => setDueDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <input className="input" placeholder="Tuỳ chọn" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Huỷ</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo phiếu mượn'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
