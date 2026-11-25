import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide student name.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide student email.'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  grade: {
    type: String,
    default: '10th Grade',
  },
  rollNumber: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  materialsAccessed: {
    type: Number,
    default: 0,
  },
  teacherEmail: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
