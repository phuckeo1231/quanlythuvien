import { GraphQLError } from 'graphql';
import dbConnect from '@/lib/mongodb.js';
import Book   from '@/models/Book.js';
import Member from '@/models/Member.js';
import Loan   from '@/models/Loan.js';
import User   from '@/models/User.js';

const PAGE_SIZE = 10;
const MAX_EXTENSIONS = 2;
const FINE_PER_DAY = 2000;
const LOAN_LIMITS = { standard: 3, premium: 7 };

function requireAuth(context) {
  if (!context?.session) {
    throw new GraphQLError('Bạn cần đăng nhập để thực hiện hành động này', { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

function requireAdmin(context) {
  requireAuth(context);
  if (context.session.user.role !== 'admin') {
    throw new GraphQLError('Chỉ quản trị viên (admin) mới có quyền thực hiện hành động này', { extensions: { code: 'FORBIDDEN' } });
  }
}

export const resolvers = {
  Query: {
    // ── Books ──────────────────────────────────────────────
    books: async (_, { search, category, page = 1, limit = PAGE_SIZE }, context) => {
      requireAuth(context);
      await dbConnect();
      const filter = {};
      if (search)   filter.$text = { $search: search };
      if (category) filter.category = category;
      const [books, total] = await Promise.all([
        Book.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Book.countDocuments(filter),
      ]);
      return { books: books.map(b => ({ ...b, id: b._id.toString() })), total };
    },

    book: async (_, { id }, context) => {
      requireAuth(context);
      await dbConnect();
      const b = await Book.findById(id).lean();
      return b ? { ...b, id: b._id.toString() } : null;
    },

    categories: async (_, __, context) => {
      requireAuth(context);
      await dbConnect();
      return Book.distinct('category');
    },

    // ── Members ─────────────────────────────────────────────
    members: async (_, { search, status, page = 1, limit = PAGE_SIZE }, context) => {
      requireAuth(context);
      await dbConnect();
      const filter = {};
      if (search) filter.$text = { $search: search };
      if (status) filter.status = status;
      const [members, total] = await Promise.all([
        Member.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Member.countDocuments(filter),
      ]);
      const ids = members.map(m => m._id);
      const activeCounts = await Loan.aggregate([
        { $match: { member: { $in: ids }, status: 'active' } },
        { $group: { _id: '$member', count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(activeCounts.map(x => [x._id.toString(), x.count]));
      return {
        members: members.map(m => ({ ...m, id: m._id.toString(), activeLoans: countMap[m._id.toString()] ?? 0 })),
        total,
      };
    },

    member: async (_, { id }, context) => {
      requireAuth(context);
      await dbConnect();
      const m = await Member.findById(id).lean();
      if (!m) return null;
      const activeLoans = await Loan.countDocuments({ member: id, status: 'active' });
      return { ...m, id: m._id.toString(), activeLoans };
    },

    // ── Loans ───────────────────────────────────────────────
    loans: async (_, { status, memberId, page = 1, limit = PAGE_SIZE }, context) => {
      requireAuth(context);
      await dbConnect();
      // Cập nhật trạng thái quá hạn trước khi truy vấn
      await Loan.updateMany(
        { status: 'active', dueDate: { $lt: new Date() } },
        { $set: { status: 'overdue' } }
      );
      const filter = {};
      if (status)   filter.status = status;
      if (memberId) filter.member = memberId;
      const [loans, total] = await Promise.all([
        Loan.find(filter)
          .populate('book')
          .populate('member')
          .sort({ borrowDate: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Loan.countDocuments(filter),
      ]);
      return { loans: loans.map(serializeLoan), total };
    },

    recentLoans: async (_, { limit = 5 }, context) => {
      requireAuth(context);
      await dbConnect();
      const loans = await Loan.find()
        .populate('book')
        .populate('member')
        .sort({ borrowDate: -1 })
        .limit(limit)
        .lean();
      return loans.map(serializeLoan);
    },

    // ── Stats ───────────────────────────────────────────────
    stats: async (_, __, context) => {
      requireAuth(context);
      await dbConnect();
      await Loan.updateMany(
        { status: 'active', dueDate: { $lt: new Date() } },
        { $set: { status: 'overdue' } }
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [totalBooks, totalMembers, activeLoans, overdueLoans, returnedToday, fineAgg, unpaidFineAgg] = await Promise.all([
        Book.countDocuments(),
        Member.countDocuments(),
        Loan.countDocuments({ status: 'active' }),
        Loan.countDocuments({ status: 'overdue' }),
        Loan.countDocuments({ status: 'returned', returnDate: { $gte: today } }),
        Loan.aggregate([{ $group: { _id: null, total: { $sum: '$fine' } } }]),
        Loan.aggregate([{ $match: { fine: { $gt: 0 }, finePaid: false } }, { $group: { _id: null, total: { $sum: '$fine' } } }]),
      ]);
      return {
        totalBooks, totalMembers, activeLoans, overdueLoans, returnedToday,
        totalFines: fineAgg[0]?.total ?? 0,
        unpaidFines: unpaidFineAgg[0]?.total ?? 0,
      };
    },

    // ── Reports ─────────────────────────────────────────────
    reports: async (_, __, context) => {
      requireAuth(context);
      await dbConnect();

      const [topBooksAgg, topMembersAgg] = await Promise.all([
        Loan.aggregate([
          { $group: { _id: '$book', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        Loan.aggregate([
          { $group: { _id: '$member', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

      const [books, members] = await Promise.all([
        Book.find({ _id: { $in: topBooksAgg.map(x => x._id) } }).lean(),
        Member.find({ _id: { $in: topMembersAgg.map(x => x._id) } }).lean(),
      ]);
      const bookMap   = Object.fromEntries(books.map(b => [b._id.toString(), { ...b, id: b._id.toString() }]));
      const memberMap = Object.fromEntries(members.map(m => [m._id.toString(), { ...m, id: m._id.toString() }]));

      const topBooks = topBooksAgg
        .filter(x => bookMap[x._id.toString()])
        .map(x => ({ book: bookMap[x._id.toString()], count: x.count }));
      const topMembers = topMembersAgg
        .filter(x => memberMap[x._id.toString()])
        .map(x => ({ member: memberMap[x._id.toString()], count: x.count }));

      // 6 tháng gần nhất, kể cả tháng không có phiếu mượn nào
      const months = [];
      const cursor = new Date();
      cursor.setDate(1);
      cursor.setHours(0, 0, 0, 0);
      for (let i = 5; i >= 0; i--) {
        const d = new Date(cursor);
        d.setMonth(d.getMonth() - i);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      const rangeStart = new Date(cursor);
      rangeStart.setMonth(rangeStart.getMonth() - 5);

      const monthlyAgg = await Loan.aggregate([
        { $match: { borrowDate: { $gte: rangeStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$borrowDate' } }, count: { $sum: 1 } } },
      ]);
      const monthlyMap = Object.fromEntries(monthlyAgg.map(x => [x._id, x.count]));
      const monthlyLoans = months.map(month => ({ month, count: monthlyMap[month] ?? 0 }));

      return { topBooks, topMembers, monthlyLoans };
    },

    // ── Users ───────────────────────────────────────────────
    users: async (_, __, context) => {
      requireAdmin(context);
      await dbConnect();
      const users = await User.find().sort({ createdAt: -1 }).lean();
      return users.map(u => ({ ...u, id: u._id.toString() }));
    },
  },

  Mutation: {
    // ── Books ──────────────────────────────────────────────
    createBook: async (_, { input }, context) => {
      requireAuth(context);
      await dbConnect();
      const book = await Book.create({ ...input, available: input.quantity ?? 1 });
      return { ...book.toObject(), id: book._id.toString() };
    },

    updateBook: async (_, { id, input }, context) => {
      requireAuth(context);
      await dbConnect();
      const book = await Book.findByIdAndUpdate(id, input, { new: true }).lean();
      return { ...book, id: book._id.toString() };
    },

    deleteBook: async (_, { id }, context) => {
      requireAdmin(context);
      await dbConnect();
      const active = await Loan.countDocuments({ book: id, status: { $in: ['active', 'overdue'] } });
      if (active > 0) throw new Error('Sách đang được mượn, không thể xóa');
      await Book.findByIdAndDelete(id);
      return true;
    },

    // ── Members ─────────────────────────────────────────────
    createMember: async (_, { input }, context) => {
      requireAuth(context);
      await dbConnect();
      const member = await Member.create(input);
      return { ...member.toObject(), id: member._id.toString(), activeLoans: 0 };
    },

    updateMember: async (_, { id, input }, context) => {
      requireAuth(context);
      await dbConnect();
      const member = await Member.findByIdAndUpdate(id, input, { new: true }).lean();
      return { ...member, id: member._id.toString() };
    },

    deleteMember: async (_, { id }, context) => {
      requireAdmin(context);
      await dbConnect();
      const active = await Loan.countDocuments({ member: id, status: { $in: ['active', 'overdue'] } });
      if (active > 0) throw new Error('Thành viên đang mượn sách, không thể xóa');
      await Member.findByIdAndDelete(id);
      return true;
    },

    // ── Loans ───────────────────────────────────────────────
    borrowBook: async (_, { bookId, memberId, dueDate, note }, context) => {
      requireAuth(context);
      await dbConnect();
      const [book, member] = await Promise.all([
        Book.findById(bookId),
        Member.findById(memberId),
      ]);
      if (!book)   throw new Error('Không tìm thấy sách');
      if (!member) throw new Error('Không tìm thấy thành viên');
      if (book.available < 1) throw new Error('Sách đã hết, không còn cuốn nào để mượn');
      if (member.status === 'suspended') throw new Error('Tài khoản thành viên đang bị tạm khóa');

      const activeLoanCount = await Loan.countDocuments({ member: memberId, status: { $in: ['active', 'overdue'] } });
      const limit = LOAN_LIMITS[member.membershipType] ?? LOAN_LIMITS.standard;
      if (activeLoanCount >= limit) {
        throw new Error(`Thành viên loại "${member.membershipType}" chỉ được mượn tối đa ${limit} sách cùng lúc`);
      }

      await Book.findByIdAndUpdate(bookId, { $inc: { available: -1 } });
      const loan = await Loan.create({ book: bookId, member: memberId, dueDate: new Date(dueDate), note });
      const populated = await loan.populate(['book', 'member']);
      return serializeLoan(populated.toObject());
    },

    returnBook: async (_, { loanId }, context) => {
      requireAuth(context);
      await dbConnect();
      const loan = await Loan.findById(loanId).populate(['book', 'member']);
      if (!loan) throw new Error('Không tìm thấy phiếu mượn');
      if (loan.status === 'returned') throw new Error('Sách này đã được trả rồi');

      const returnDate = new Date();
      const dueDate    = new Date(loan.dueDate);
      let fine = 0;
      if (returnDate > dueDate) {
        const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fine = daysLate * FINE_PER_DAY;
      }

      loan.returnDate = returnDate;
      loan.status     = 'returned';
      loan.fine       = fine;
      await loan.save();
      await Book.findByIdAndUpdate(loan.book._id, { $inc: { available: 1 } });

      return serializeLoan(loan.toObject());
    },

    extendLoan: async (_, { loanId, newDueDate }, context) => {
      requireAuth(context);
      await dbConnect();
      const loan = await Loan.findById(loanId).populate(['book', 'member']);
      if (!loan) throw new Error('Không tìm thấy phiếu mượn');
      if (loan.status === 'returned') throw new Error('Sách này đã được trả, không thể gia hạn');
      if (loan.extendCount >= MAX_EXTENSIONS) throw new Error(`Phiếu mượn này đã gia hạn tối đa ${MAX_EXTENSIONS} lần`);

      const next = new Date(newDueDate);
      if (next <= new Date(loan.dueDate)) throw new Error('Ngày gia hạn phải sau hạn trả hiện tại');

      loan.dueDate = next;
      loan.status = 'active';
      loan.extendCount += 1;
      await loan.save();

      return serializeLoan(loan.toObject());
    },

    payFine: async (_, { loanId }, context) => {
      requireAuth(context);
      await dbConnect();
      const loan = await Loan.findById(loanId).populate(['book', 'member']);
      if (!loan) throw new Error('Không tìm thấy phiếu mượn');
      if (!loan.fine || loan.fine <= 0) throw new Error('Phiếu mượn này không có tiền phạt');
      if (loan.finePaid) throw new Error('Tiền phạt đã được thu rồi');

      loan.finePaid = true;
      loan.finePaidAt = new Date();
      await loan.save();

      return serializeLoan(loan.toObject());
    },

    // ── Users (admin) ───────────────────────────────────────
    createUser: async (_, { input }, context) => {
      requireAdmin(context);
      await dbConnect();
      if (!input.password) throw new Error('Vui lòng nhập mật khẩu');
      const user = await User.create(input);
      return { ...user.toObject(), id: user._id.toString() };
    },

    updateUser: async (_, { id, input }, context) => {
      requireAdmin(context);
      await dbConnect();
      const update = { name: input.name, email: input.email, role: input.role };
      if (input.password) update.password = input.password;
      let user;
      if (input.password) {
        // chạy qua .save() để hook hash mật khẩu được kích hoạt
        user = await User.findById(id);
        if (!user) throw new Error('Không tìm thấy người dùng');
        Object.assign(user, update);
        await user.save();
        user = user.toObject();
      } else {
        user = await User.findByIdAndUpdate(id, update, { new: true }).lean();
      }
      return { ...user, id: user._id.toString() };
    },

    deleteUser: async (_, { id }, context) => {
      requireAdmin(context);
      await dbConnect();
      if (context.session.user.id === id) throw new Error('Không thể tự xóa tài khoản của chính mình');
      const target = await User.findById(id).lean();
      if (!target) throw new Error('Không tìm thấy người dùng');
      if (target.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) throw new Error('Không thể xóa admin cuối cùng');
      }
      await User.findByIdAndDelete(id);
      return true;
    },
  },
};

function serializeLoan(l) {
  return {
    ...l,
    id:     l._id.toString(),
    book:   l.book   ? { ...l.book,   id: l.book._id.toString() }   : l.book,
    member: l.member ? { ...l.member, id: l.member._id.toString() } : l.member,
    borrowDate: l.borrowDate?.toISOString?.() ?? l.borrowDate,
    dueDate:    l.dueDate?.toISOString?.()    ?? l.dueDate,
    returnDate: l.returnDate?.toISOString?.() ?? l.returnDate ?? null,
    // phiếu mượn tạo trước khi thêm các field này vào schema sẽ thiếu key trong Mongo
    finePaid:    l.finePaid ?? false,
    extendCount: l.extendCount ?? 0,
  };
}
