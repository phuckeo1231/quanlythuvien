'use client';
import { useMutation, gql } from '@apollo/client';
import Badge from '@/components/ui/Badge.jsx';

const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) { deleteBook(id: $id) }
`;

export default function BookTable({ books, onEdit, onRefetch }) {
  const [deleteBook] = useMutation(DELETE_BOOK);

  async function handleDelete(book) {
    if (!confirm(`Xóa sách "${book.title}"?`)) return;
    try {
      await deleteBook({ variables: { id: book.id } });
      onRefetch();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!books.length) {
    return <div className="text-center py-16 text-gray-400">Chưa có sách nào</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Tên sách</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Tác giả</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Thể loại</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Số lượng</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Có sẵn</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {books.map(b => (
            <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{b.title}</p>
                {b.isbn && <p className="text-xs text-gray-400">ISBN: {b.isbn}</p>}
              </td>
              <td className="py-3 px-4 text-gray-600">{b.author}</td>
              <td className="py-3 px-4">
                <Badge label={b.category ?? 'Khác'} variant="standard" />
              </td>
              <td className="py-3 px-4 text-center font-medium">{b.quantity}</td>
              <td className="py-3 px-4 text-center">
                <span className={`font-semibold ${b.available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {b.available}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button onClick={() => onEdit(b)} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Sửa</button>
                <button onClick={() => handleDelete(b)} className="text-red-500 hover:text-red-700 font-medium">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
