'use client';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import UserTable from '@/components/users/UserTable.jsx';
import UserModal from '@/components/users/UserModal.jsx';

const GET_USERS = gql`
  query GetUsers {
    users { id name email role createdAt }
  }
`;

export default function UsersPageClient() {
  const [modal, setModal] = useState(null);
  const { data, loading, refetch } = useQuery(GET_USERS, { fetchPolicy: 'cache-and-network' });
  const users = data?.users ?? [];

  function handleSaved() { setModal(null); refetch(); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} tài khoản</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Thêm nhân viên</button>
      </div>

      <div className="card">
        {loading
          ? <div className="p-12 text-center text-gray-400">Đang tải...</div>
          : <UserTable users={users} onEdit={u => setModal(u)} onRefetch={refetch} />
        }
      </div>

      {modal && (
        <UserModal
          user={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
