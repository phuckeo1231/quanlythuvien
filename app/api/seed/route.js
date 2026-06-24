import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb.js';
import User from '@/models/User.js';

// POST /api/seed — tạo tài khoản admin mặc định (chỉ dùng lần đầu)
export async function POST() {
  await dbConnect();
  const exists = await User.findOne({ email: 'admin@library.com' });
  if (exists) return NextResponse.json({ message: 'Admin đã tồn tại' }, { status: 400 });
  await User.create({ name: 'Admin', email: 'admin@library.com', password: 'admin123', role: 'admin' });
  return NextResponse.json({ message: 'Tạo admin thành công: admin@library.com / admin123' });
}
