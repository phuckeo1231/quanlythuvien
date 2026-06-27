'use client';
import { useMutation, gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import Badge from '@/components/ui/Badge.jsx';

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) { deleteUser(id: $id) }
`;

const ROLE_LABEL   = { admin: 'Quản trị viên', staff: 'Nhân viên' };
const ROLE_VARIANT = { admin: 'premium', staff: 'standard' };

export default function UserTable({ users, onEdit, onRefetch }) {
  const { data: session } = useSession();
  const [deleteUser] = useMutation(DELETE_USER);

  async function handleDelete(user) {
    if (!confirm(`Xóa tài khoản "${user.name}"?`)) return;
    try {
      await deleteUser({ variables: { id: user.id } });
      onRefetch();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!users.length) {
    return <div className="text-center py-16 text-gray-400">Chưa có nhân viên nào</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Họ tên</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Vai trò</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isSelf = session?.user?.id === u.id;
            return (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {u.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(bạn)</span>}
                </td>
                <td className="py-3 px-4 text-gray-600">{u.email}</td>
                <td className="py-3 px-4 text-center">
                  <Badge label={ROLE_LABEL[u.role]} variant={ROLE_VARIANT[u.role]} />
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => onEdit(u)} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Sửa</button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={isSelf}
                    className="text-red-500 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
