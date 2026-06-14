import express from 'express';
import { upload, uploadVideoToCloudinary, cloudinary } from '../config/cloudinary.js';
import Course from '../models/Course.js';

const router = express.Router();

// 1. Create a New Course with its Initial Chapter & Multi-Question Activity
router.post('/create', upload.single('video'), async (req, res) => {
  try {
    const { title, description, chapterTitle, activityData } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No video file provided' });

    const cloudMedia = await uploadVideoToCloudinary(req.file.buffer);
    const parsedActivity = activityData ? JSON.parse(activityData) : [];

    const newCourse = new Course({
      title,
      description,
      chapters: [{ 
        title: chapterTitle, 
        videoUrl: cloudMedia.url, 
        publicId: cloudMedia.publicId,
        activities: parsedActivity // Updated to store array of activities
      }]
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Add a New Chapter to an Existing Course
router.post('/:id/add-chapter', upload.single('video'), async (req, res) => {
  try {
    const { chapterTitle, activityData } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!req.file) return res.status(400).json({ message: 'No video file provided' });

    const cloudMedia = await uploadVideoToCloudinary(req.file.buffer);
    const parsedActivity = activityData ? JSON.parse(activityData) : [];
    
    course.chapters.push({ 
      title: chapterTitle, 
      videoUrl: cloudMedia.url, 
      publicId: cloudMedia.publicId,
      activities: parsedActivity
    });
    
    await course.save();
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Get All Courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Get a Single Course Detail
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Update Course Metadata, Replace Videos, or Save Global Activity Changes
router.put('/:id', upload.single('video'), async (req, res) => {
  try {
    const { title, description, chaptersData } = req.body; 
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.title = title || course.title;
    course.description = description || course.description;

    if (chaptersData) {
      course.chapters = JSON.parse(chaptersData);
    }

    if (req.file && req.body.replaceIndex !== undefined) {
      const index = parseInt(req.body.replaceIndex);
      await cloudinary.uploader.destroy(course.chapters[index].publicId, { resource_type: 'video' });
      
      const cloudMedia = await uploadVideoToCloudinary(req.file.buffer);
      course.chapters[index].videoUrl = cloudMedia.url;
      course.chapters[index].publicId = cloudMedia.publicId;
    }

    await course.save();
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Delete a Specific Chapter
router.delete('/:courseId/chapter/:chapterId/:publicId', async (req, res) => {
  try {
    const { courseId, chapterId, publicId } = req.params;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    
    await Course.findByIdAndUpdate(courseId, {
      $pull: { chapters: { _id: chapterId } }
    });

    res.status(200).json({ message: 'Chapter removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. NEW: Delete an Entire Course (Fixes the 404 Error)
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Delete all associated videos from Cloudinary
    for (const chapter of course.chapters) {
      if (chapter.publicId) {
        await cloudinary.uploader.destroy(chapter.publicId, { resource_type: 'video' });
      }
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Course purged successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;