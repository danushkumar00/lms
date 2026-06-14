import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  activity: {
    activityType: { type: String, enum: ['drag-drop', 'fill-blanks'], default: 'fill-blanks' },
    // Supports N number of dynamic fill in the blank sentences
    fillBlanks: [{
      question: { type: String, default: '' },
      options: [{ type: String }],
      correctAnswer: { type: String, default: '' }
    }],
    // Supports N number of match-the-following pairs (Left dragged to Right)
    matchPairs: [{
      left: { type: String, default: '' },   // Draggable Word
      right: { type: String, default: '' }   // Static Definition Match Target
    }]
  }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  chapters: [chapterSchema],
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);