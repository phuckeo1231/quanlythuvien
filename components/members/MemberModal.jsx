'use client';
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import Modal from '@/components/ui/Modal.jsx';

const CREATE_MEMBER = gql`
  mutation CreateMember($input: MemberInput!) {
    createMember(input: $input) { id name email }
  }
`;
const UPDATE_MEMBER = gql`
  mutation UpdateMember($id: ID!, $input: MemberInput!) {
    updateMember(id: $id, input: $input) { id name email }
  }
`;

export default function MemberModal({ member, onClose, onSaved }) {
  const isEdit = !!member;
  const [form, setForm] = useState({
    name:           member?.name           ?? '',
    email:          member?.email          ?? '',
    phone:          member?.phone          ?? '',
    address:        member?.address        ?? '',
    membershipType: member?.membershipType ?? 'standard',
    status:         member?.status         ?? 'active',
  });
  const [error, setError] = useState('');

  const [createMember, { loading: creating }] = useMutation(CREATE_MEMBER);
  const [updateMember, { loading: updating }] = useMutation(UPDATE_MEMBER);
  const loading = creating || updating;

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) await updateMember({ variables: { id: member.id, input: form } });
      else        await createMember({ variables: { input: form } });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={isEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại thành viên</label>
            <select className="input" value={form.membershipType} onChange={e => set('membershipType', e.target.value)}>
              <option value="standard">Thường</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Hoạt động</option>
                <option value="suspended">Tạm khóa</option>
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Huỷ</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm thành viên')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
