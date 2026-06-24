import dbConnect from '@/lib/mongodb.js';
import Book   from '@/models/Book.js';
import Member from '@/models/Member.js';
import Loan   from '@/models/Loan.js';

const PAGE_SIZE = 10;

export const resolvers = {
  Query: {
    // ── Books ──────────────────────────────────────────────
    books: async (_, { search, category, page = 1, limit = PAGE_SIZE }) => {
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

    book: async (_, { id }) => {
      await dbConnect();
      const b = await Book.findById(id).lean();
      return b ? { ...b, id: b._id.toString() } : null;
    },

    categories: async () => {
      await dbConnect();
      return Book.distinct('category');
    },

    // ── Members ─────────────────────────────────────────────
    members: async (_, { search, status, page = 1, limit = PAGE_SIZE }) => {
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

    member: async (_, { id }) => {
      await dbConnect();
      const m = await Member.findById(id).lean();
      if (!m) return null;
      const activeLoans = await Loan.countDocuments({ member: id, status: 'active' });
      return { ...m, id: m._id.toString(), activeLoans };
    },

    // ── Loans ───────────────────────────────────────────────
    loans: async (_, { status, memberId, page = 1, limit = PAGE_SIZE }) => {
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

    recentLoans: async (_, { limit = 5 }) => {
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
    stats: async () => {
      await dbConnect();
      await Loan.updateMany(
        { status: 'active', dueDate: { $lt: new Date() } },
        { $set: { status: 'overdue' } }
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [totalBooks, totalMembers, activeLoans, overdueLoans, returnedToday, fineAgg] = await Promise.all([
        Book.countDocuments(),
        Member.countDocuments(),
        Loan.countDocuments({ status: 'active' }),
        Loan.countDocuments({ status: 'overdue' }),
        Loan.countDocuments({ status: 'returned', returnDate: { $gte: today } }),
        Loan.aggregate([{ $group: { _id: null, total: { $sum: '$fine' } } }]),
      ]);
      return {
        totalBooks, totalMembers, activeLoans, overdueLoans, returnedToday,
        totalFines: fineAgg[0]?.total ?? 0,
      };
    },
  },

  Mutation: {
    // ── Books ──────────────────────────────────────────────
    createBook: async (_, { input }) => {
      await dbConnect();
      const book = await Book.create({ ...input, available: input.quantity ?? 1 });
      return { ...book.toObject(), id: book._id.toString() };
    },

    updateBook: async (_, { id, input }) => {
      await dbConnect();
      const book = await Book.findByIdAndUpdate(id, input, { new: true }).lean();
      return { ...book, id: book._id.toString() };
    },

    deleteBook: async (_, { id }) => {
      await dbConnect();
      const active = await Loan.countDocuments({ book: id, status: { $in: ['active', 'overdue'] } });
      if (active > 0) throw new Error('Sách đang được mượn, không thể xóa');
      await Book.findByIdAndDelete(id);
      return true;
    },

    // ── Members ─────────────────────────────────────────────
    createMember: async (_, { input }) => {
      await dbConnect();
      const member = await Member.create(input);
      return { ...member.toObject(), id: member._id.toString(), activeLoans: 0 };
    },

    updateMember: async (_, { id, input }) => {
      await dbConnect();
      const member = await Member.findByIdAndUpdate(id, input, { new: true }).lean();
      return { ...member, id: member._id.toString() };
    },

    deleteMember: async (_, { id }) => {
      await dbConnect();
      const active = await Loan.countDocuments({ member: id, status: { $in: ['active', 'overdue'] } });
      if (active > 0) throw new Error('Thành viên đang mượn sách, không thể xóa');
      await Member.findByIdAndDelete(id);
      return true;
    },

    // ── Loans ───────────────────────────────────────────────
    borrowBook: async (_, { bookId, memberId, dueDate, note }) => {
      await dbConnect();
      const [book, member] = await Promise.all([
        Book.findById(bookId),
        Member.findById(memberId),
      ]);
      if (!book)   throw new Error('Không tìm thấy sách');
      if (!member) throw new Error('Không tìm thấy thành viên');
      if (book.available < 1) throw new Error('Sách đã hết, không còn cuốn nào để mượn');
      if (member.status === 'suspended') throw new Error('Tài khoản thành viên đang bị tạm khóa');

      await Book.findByIdAndUpdate(bookId, { $inc: { available: -1 } });
      const loan = await Loan.create({ book: bookId, member: memberId, dueDate: new Date(dueDate), note });
      const populated = await loan.populate(['book', 'member']);
      return serializeLoan(populated.toObject());
    },

    returnBook: async (_, { loanId }) => {
      await dbConnect();
      const loan = await Loan.findById(loanId).populate(['book', 'member']);
      if (!loan) throw new Error('Không tìm thấy phiếu mượn');
      if (loan.status === 'returned') throw new Error('Sách này đã được trả rồi');

      const returnDate = new Date();
      const dueDate    = new Date(loan.dueDate);
      let fine = 0;
      if (returnDate > dueDate) {
        const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fine = daysLate * 2000; // 2.000đ/ngày
      }

      loan.returnDate = returnDate;
      loan.status     = 'returned';
      loan.fine       = fine;
      await loan.save();
      await Book.findByIdAndUpdate(loan.book._id, { $inc: { available: 1 } });

      return serializeLoan(loan.toObject());
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
  };
}
