'use client';
import { useMutation, gql } from '@apollo/client';
import Badge from '@/components/ui/Badge.jsx';

const DELETE_MEMBER = gql`
  mutation DeleteMember($id: ID!) { deleteMember(id: $id) }
`;

export default function MemberTable({ members, onEdit, onRefetch }) {
  const [deleteMember] = useMutation(DELETE_MEMBER);

  async function handleDelete(member) {
    if (!confirm(`Xóa thành viên "${member.name}"?`)) return;
    try {
      await deleteMember({ variables: { id: member.id } });
      onRefetch();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!members.length) {
    return <div className="text-center py-16 text-gray-400">Chưa có thành viên nào</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Thành viên</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Liên hệ</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Loại</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Trạng thái</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Đang mượn</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-400">{new Date(Number(m.joinDate)).toLocaleDateString('vi-VN')}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-gray-600">{m.email}</p>
                {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge label={m.membershipType === 'premium' ? 'Premium' : 'Thường'} variant={m.membershipType} />
              </td>
              <td className="py-3 px-4 text-center">
                <Badge label={m.status === 'active' ? 'Hoạt động' : 'Tạm khóa'} variant={m.status} />
              </td>
              <td className="py-3 px-4 text-center font-semibold text-gray-700">{m.activeLoans ?? 0}</td>
              <td className="py-3 px-4 text-right">
                <button onClick={() => onEdit(m)} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Sửa</button>
                <button onClick={() => handleDelete(m)} className="text-red-500 hover:text-red-700 font-medium">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
