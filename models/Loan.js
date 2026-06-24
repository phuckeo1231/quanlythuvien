import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  book:       { type: mongoose.Schema.Types.ObjectId, ref: 'Book',   required: true },
  member:     { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  borrowDate: { type: Date, default: Date.now },
  dueDate:    { type: Date, required: true },
  returnDate: { type: Date },
  status:     { type: String, enum: ['active', 'returned', 'overdue'], default: 'active' },
  fine:       { type: Number, default: 0 },
  note:       { type: String, trim: true },
}, { timestamps: true });

export default mongoose.models.Loan || mongoose.model('Loan', loanSchema);
