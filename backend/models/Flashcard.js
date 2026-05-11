import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flashcards: [{
    front: {
      type: String,
      required: true
    },
    back: {
      type: String,
      required: true
    }
  }],
  count: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Flashcard', flashcardSchema);
