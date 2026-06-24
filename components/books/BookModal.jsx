'use client';
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import Modal from '@/components/ui/Modal.jsx';

const CREATE_BOOK = gql`
  mutation CreateBook($input: BookInput!) {
    createBook(input: $input) { id title author }
  }
`;
const UPDATE_BOOK = gql`
  mutation UpdateBook($id: ID!, $input: BookInput!) {
    updateBook(id: $id, input: $input) { id title author }
  }
`;

const CATEGORIES = ['Văn học', 'Khoa học', 'Lịch sử', 'Kinh tế', 'Kỹ thuật', 'Thiếu nhi', 'Ngoại ngữ', 'Khác'];

export default function BookModal({ book, onClose, onSaved }) {
  const isEdit = !!book;
  const [form, setForm] = useState({
    title:       book?.title       ?? '',
    author:      book?.author      ?? '',
    isbn:        book?.isbn        ?? '',
    category:    book?.category    ?? 'Khác',
    quantity:    book?.quantity    ?? 1,
    publishYear: book?.publishYear ?? '',
    publisher:   book?.publisher   ?? '',
    description: book?.description ?? '',
  });
  const [error, setError] = useState('');

  const [createBook, { loading: creating }] = useMutation(CREATE_BOOK);
  const [updateBook, { loading: updating }] = useMutation(UPDATE_BOOK);
  const loading = creating || updating;

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const input = {
      ...form,
      quantity:    parseInt(form.quantity) || 1,
      publishYear: form.publishYear ? parseInt(form.publishYear) : null,
    };
    try {
      if (isEdit) await updateBook({ variables: { id: book.id, input } });
      else        await createBook({ variables: { input } });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={isEdit ? 'Chỉnh sửa sách' : 'Thêm sách mới'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sách *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả *</label>
            <input className="input" value={form.author} onChange={e => set('author', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
            <input className="input" value={form.isbn} onChange={e => set('isbn', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
            <input type="number" min="1" className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm xuất bản</label>
            <input type="number" className="input" placeholder="2024" value={form.publishYear} onChange={e => set('publishYear', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà xuất bản</label>
            <input className="input" value={form.publisher} onChange={e => set('publisher', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Huỷ</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm sách')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
