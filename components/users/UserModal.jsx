'use client';
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import Modal from '@/components/ui/Modal.jsx';

const CREATE_USER = gql`
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) { id name email role }
  }
`;
const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserInput!) {
    updateUser(id: $id, input: $input) { id name email role }
  }
`;

export default function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'staff',
  });
  const [error, setError] = useState('');

  const [createUser, { loading: creating }] = useMutation(CREATE_USER);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);
  const loading = creating || updating;

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) await updateUser({ variables: { id: user.id, input: form } });
      else        await createUser({ variables: { input: form } });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu {isEdit ? '(để trống nếu không đổi)' : '*'}
          </label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            required={!isEdit}
            placeholder={isEdit ? '••••••' : ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
          <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="staff">Nhân viên (Staff)</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm nhân viên')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
