// frontend/src/pages/UploadCourse.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

const UploadCourse = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', chapterTitle: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [activities, setActivities] = useState([{
    timestamp: 0,
    activityType: 'fill-blanks',
    question: '',
    options: '',
    correctAnswer: '',
    matchPairs: [{ left: '', right: '' }]
  }]);

  const addActivity = () => setActivities([...activities, { 
    timestamp: 0, activityType: 'fill-blanks', question: '', options: '', correctAnswer: '', matchPairs: [{ left: '', right: '' }] 
  }]);
  
  const updateActivity = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = value;
    setActivities(updated);
  };

  const updateMatchPair = (actIdx, pairIdx, field, value) => {
    const updated = [...activities];
    updated[actIdx].matchPairs[pairIdx][field] = value;
    setActivities(updated);
  };

  const addMatchPair = (actIdx) => {
    const updated = [...activities];
    updated[actIdx].matchPairs.push({ left: '', right: '' });
    setActivities(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return; // Prevent double-submission
    if (!videoFile) return alert("Please upload a video file.");

    setIsUploading(true);

    const processedActivities = activities.map(act => ({
      ...act,
      timestamp: Number(act.timestamp) * 60,
      options: act.activityType === 'fill-blanks' ? act.options.split(',').map(o => o.trim()).filter(Boolean) : []
    }));

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('chapterTitle', formData.chapterTitle);
    payload.append('video', videoFile);
    payload.append('activityData', JSON.stringify(processedActivities));

    try {
      await axios.post('http://localhost:5001/api/courses/create', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Course created successfully!");
      navigate('/trainer-dashboard');
    } catch (err) {
      console.error(err);
      alert("Error building course structures: " + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-3xl rounded-xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Course Blueprint</h2>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Course Title</label>
              <input type="text" required className="w-full border rounded-lg p-2.5 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea required rows="2" className="w-full border rounded-lg p-2.5 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-blue-900 text-sm">Chapter 1 Content</h3>
              <input type="text" placeholder="Chapter Title" required className="w-full border rounded p-2" onChange={e => setFormData({...formData, chapterTitle: e.target.value})} />
              <input type="file" accept="video/*" required onChange={e => setVideoFile(e.target.files[0])} />
            </div>

            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-purple-900 text-sm">Interactive Timeline Activities</h3>
              {activities.map((act, actIdx) => (
                <div key={actIdx} className="bg-white p-4 rounded-lg border flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Trigger Time (Minutes)</label>
                  <input type="number" step="0.1" className="border rounded p-1 text-xs" value={act.timestamp} onChange={e => updateActivity(actIdx, 'timestamp', e.target.value)} />
                  
                  <select className="border rounded p-1 text-xs" value={act.activityType} onChange={e => updateActivity(actIdx, 'activityType', e.target.value)}>
                    <option value="fill-blanks">Fill in the Blanks</option>
                    <option value="drag-drop">Drag & Drop</option>
                  </select>

                  {act.activityType === 'fill-blanks' ? (
                    <>
                      <input type="text" placeholder="Question" className="border rounded p-1 text-xs" onChange={e => updateActivity(actIdx, 'question', e.target.value)} />
                      <input type="text" placeholder="Options (comma separated)" className="border rounded p-1 text-xs" onChange={e => updateActivity(actIdx, 'options', e.target.value)} />
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {act.matchPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="flex gap-2">
                          <input type="text" placeholder="Left" className="border rounded p-1 text-xs w-1/2" onChange={e => updateMatchPair(actIdx, pIdx, 'left', e.target.value)} />
                          <input type="text" placeholder="Right" className="border rounded p-1 text-xs w-1/2" onChange={e => updateMatchPair(actIdx, pIdx, 'right', e.target.value)} />
                        </div>
                      ))}
                      <button type="button" onClick={() => addMatchPair(actIdx)} className="text-[9px] bg-gray-100 p-1 rounded">+ Add Pair</button>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={addActivity} className="text-xs bg-purple-100 p-2 rounded">+ Add Activity Point</button>
            </div>
            
            <button 
              type="submit" 
              disabled={isUploading} 
              className={`p-2 rounded-lg text-white ${isUploading ? 'bg-gray-400' : 'bg-purple-600'}`}
            >
              {isUploading ? 'Uploading...' : 'Publish Course'}
            </button>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
};

export default UploadCourse;