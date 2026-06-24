'use client';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import MemberTable  from '@/components/members/MemberTable.jsx';
import MemberModal  from '@/components/members/MemberModal.jsx';
import Pagination   from '@/components/ui/Pagination.jsx';

const GET_MEMBERS = gql`
  query GetMembers($search: String, $status: String, $page: Int) {
    members(search: $search, status: $status, page: $page, limit: 10) {
      members { id name email phone address membershipType status joinDate activeLoans }
      total
    }
  }
`;

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page,   setPage]   = useState(1);
  const [modal,  setModal]  = useState(null);

  const { data, loading, refetch } = useQuery(GET_MEMBERS, {
    variables: { search: search || undefined, status: status || undefined, page },
    fetchPolicy: 'cache-and-network',
  });

  const members = data?.members?.members ?? [];
  const total   = data?.members?.total   ?? 0;

  function handleSearch(e) { setSearch(e.target.value); setPage(1); }
  function handleSaved()   { setModal(null); refetch(); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Thành viên</h1>
          <p className="text-sm text-gray-500 mt-1">{total} thành viên</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Thêm thành viên</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Tìm theo tên, email, số điện thoại..."
          value={search}
          onChange={handleSearch}
        />
        <select className="input max-w-xs" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="suspended">Tạm khóa</option>
        </select>
      </div>

      <div className="card">
        {loading
          ? <div className="p-12 text-center text-gray-400">Đang tải...</div>
          : <MemberTable members={members} onEdit={m => setModal(m)} onRefetch={refetch} />
        }
        <div className="px-4 pb-4">
          <Pagination page={page} total={total} limit={10} onChange={setPage} />
        </div>
      </div>

      {modal && (
        <MemberModal
          member={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
