// backend/models/Course.js
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  timestamp: { type: Number, required: true }, // Saved in seconds (e.g., 45 for 0:45)
  activityType: { type: String, enum: ['drag-drop', 'fill-blanks'], default: 'drag-drop' },
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, required: true }
});

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  activities: [activitySchema] // Supports N number of timed activities
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  chapters: [chapterSchema]
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);