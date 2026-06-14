// backend/routes/CourseRoutes.js
import express from 'express';
import { upload, uploadVideoToCloudinary, cloudinary } from '../config/cloudinary.js';
import Course from '../models/Course.js';

const router = express.Router();

// 1. Create Course with N Timed Activities
router.post('/create', upload.single('video'), async (req, res) => {
  try {
    const { title, description, chapterTitle, activities } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Missing video asset file.' });

    const cloudMedia = await uploadVideoToCloudinary(req.file.buffer);
    const parsedActivities = activities ? JSON.parse(activities) : [];

    const newCourse = new Course({
      title,
      description,
      chapters: [{
        title: chapterTitle,
        videoUrl: cloudMedia.url,
        publicId: cloudMedia.publicId,
        activities: parsedActivities
      }]
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Add Chapter with N Timed Activities to Existing Course
router.post('/:id/add-chapter', upload.single('video'), async (req, res) => {
  try {
    const { chapterTitle, activities } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!req.file) return res.status(400).json({ message: 'Missing video asset file.' });

    const cloudMedia = await uploadVideoToCloudinary(req.file.buffer);
    const parsedActivities = activities ? JSON.parse(activities) : [];

    course.chapters.push({
      title: chapterTitle,
      videoUrl: cloudMedia.url,
      publicId: cloudMedia.publicId,
      activities: parsedActivities
    });

    await course.save();
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Complete Course Update & Overwrite (Handles full CRUD tracking of chapters & activities)
router.put('/:id', upload.single('video'), async (req, res) => {
  try {
    const { title, description, chapters } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (title) course.title = title;
    if (description) course.description = description;
    
    // Direct state sync update if full chapters array passed down
    if (chapters) {
      course.chapters = JSON.parse(chapters);
    }

    // Handle specific file replacements if flag is active
    if (req.file && req.body.replaceIndex !== undefined) {
      const idx = parseInt(req.body.replaceIndex);
      if (course.chapters[idx]) {
        await cloudinary.uploader.destroy(course.chapters[idx].publicId, { resource_type: 'video' });
        const cloudMedia = await uploadVideoToCloudinary(req.file.buffer);
        course.chapters[idx].videoUrl = cloudMedia.url;
        course.chapters[idx].publicId = cloudMedia.publicId;
      }
    }

    await course.save();
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Get All Courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Get Single Course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course record missing.' });
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Delete Chapter Complete
router.delete('/:courseId/chapter/:chapterId/:publicId', async (req, res) => {
  try {
    const { courseId, chapterId, publicId } = req.params;
    await cloudinary.uploader.destroy(`courses/${publicId}`, { resource_type: 'video' });
    
    await Course.findByIdAndUpdate(courseId, {
      $pull: { chapters: { _id: chapterId } }
    });
    res.status(200).json({ message: 'Chapter pulled successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;