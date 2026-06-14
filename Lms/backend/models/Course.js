// backend/models/Course.js
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  activityType: { type: String, enum: ['drag-drop', 'fill-blanks'], default: 'fill-blanks' },
  question: { type: String, default: '' },
  options: [{ type: String }],
  correctAnswer: { type: String, default: '' },
  matchPairs: [{
    left: { type: String, default: '' },
    right: { type: String, default: '' }
  }]
});

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  activities: [activitySchema] // Array of activities at different timestamps
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  chapters: [chapterSchema],
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);