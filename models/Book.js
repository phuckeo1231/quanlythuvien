import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  author:      { type: String, required: true, trim: true },
  isbn:        { type: String, unique: true, sparse: true, trim: true },
  category:    { type: String, default: 'Khác' },
  quantity:    { type: Number, default: 1, min: 0 },
  available:   { type: Number, default: 1, min: 0 },
  publishYear: { type: Number },
  publisher:   { type: String, trim: true },
  description: { type: String, trim: true },
  imageUrl:    { type: String, trim: true },
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
