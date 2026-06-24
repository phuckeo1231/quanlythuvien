import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone:          { type: String, trim: true },
  address:        { type: String, trim: true },
  membershipType: { type: String, enum: ['standard', 'premium'], default: 'standard' },
  status:         { type: String, enum: ['active', 'suspended'], default: 'active' },
  joinDate:       { type: Date, default: Date.now },
}, { timestamps: true });

memberSchema.index({ name: 'text', email: 'text', phone: 'text' });

export default mongoose.models.Member || mongoose.model('Member', memberSchema);
