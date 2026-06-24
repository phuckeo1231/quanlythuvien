'use client';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import BookTable  from '@/components/books/BookTable.jsx';
import BookModal  from '@/components/books/BookModal.jsx';
import Pagination from '@/components/ui/Pagination.jsx';

const GET_BOOKS = gql`
  query GetBooks($search: String, $category: String, $page: Int) {
    books(search: $search, category: $category, page: $page, limit: 10) {
      books { id title author isbn category quantity available publishYear publisher description }
      total
    }
    categories
  }
`;

export default function BooksPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [page,     setPage]     = useState(1);
  const [modal,    setModal]    = useState(null); // null | 'add' | book object

  const { data, loading, refetch } = useQuery(GET_BOOKS, {
    variables: { search: search || undefined, category: category || undefined, page },
    fetchPolicy: 'cache-and-network',
  });

  const books      = data?.books?.books ?? [];
  const total      = data?.books?.total ?? 0;
  const categories = data?.categories   ?? [];

  function handleSearch(e) { setSearch(e.target.value); setPage(1); }
  function handleSaved()   { setModal(null); refetch(); }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Sách</h1>
          <p className="text-sm text-gray-500 mt-1">{total} đầu sách</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Thêm sách</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Tìm kiếm tên sách, tác giả, ISBN..."
          value={search}
          onChange={handleSearch}
        />
        <select className="input max-w-xs" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">Tất cả thể loại</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading
          ? <div className="p-12 text-center text-gray-400">Đang tải...</div>
          : <BookTable books={books} onEdit={b => setModal(b)} onRefetch={refetch} />
        }
        <div className="px-4 pb-4">
          <Pagination page={page} total={total} limit={10} onChange={setPage} />
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <BookModal
          book={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
