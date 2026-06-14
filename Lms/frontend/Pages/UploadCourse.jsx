
import { useState } from 'react';
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

  const removeActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;
    if (!videoFile) return alert("Please upload a video file.");

    setIsUploading(true);

    const processedActivities = activities.map(act => ({
      ...act,
      timestamp: Number(act.timestamp) * 60,
      options: act.activityType === 'fill-blanks'
        ? act.options.split(',').map(o => o.trim()).filter(Boolean)
        : [],
      // For drag-drop, correctAnswer is derived from matchPairs on the backend — no need to send it
    }));

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('chapterTitle', formData.chapterTitle);
    payload.append('video', videoFile);
    payload.append('activityData', JSON.stringify(processedActivities));

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/courses/create`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Course created successfully!");
      navigate('/trainer-dashboard');
    } catch (err) {
      console.error(err);
      alert("Error creating course: " + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-3xl rounded-xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h2>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">

            <div>
              <label className="block text-sm font-semibold mb-2">Course Title</label>
              <input type="text" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-300"
                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea required rows="2" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-300"
                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-blue-900 text-sm">Chapter 1 Content</h3>
              <input type="text" placeholder="Chapter Title" required className="w-full border rounded p-2"
                onChange={e => setFormData({ ...formData, chapterTitle: e.target.value })} />
              <input type="file" accept="video/*" required onChange={e => setVideoFile(e.target.files[0])} />
            </div>

            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-purple-900 text-sm">Interactive Timeline Activities</h3>

              {activities.map((act, actIdx) => (
                <div key={actIdx} className="bg-white p-4 rounded-lg border flex flex-col gap-3 relative">

                  {/* Remove activity button */}
                  {activities.length > 1 && (
                    <button type="button" onClick={() => removeActivity(actIdx)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xs font-bold">✕</button>
                  )}

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Trigger Time (Minutes)</label>
                      <input type="number" step="0.1" min="0" className="w-full border rounded p-1 text-xs mt-1"
                        value={act.timestamp} onChange={e => updateActivity(actIdx, 'timestamp', e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Activity Type</label>
                      <select className="w-full border rounded p-1 text-xs mt-1"
                        value={act.activityType} onChange={e => updateActivity(actIdx, 'activityType', e.target.value)}>
                        <option value="fill-blanks">Fill in the Blanks</option>
                        <option value="drag-drop">Drag & Drop</option>
                      </select>
                    </div>
                  </div>

                  {/* Question field — shared by both types */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Question</label>
                    <input type="text" placeholder="Enter the question" className="w-full border rounded p-1 text-xs mt-1"
                      value={act.question} onChange={e => updateActivity(actIdx, 'question', e.target.value)} />
                  </div>

                  {/* FILL IN THE BLANKS fields */}
                  {act.activityType === 'fill-blanks' && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Options (comma separated — shown as hints)</label>
                        <input type="text" placeholder="e.g. Paris, London, Berlin" className="w-full border rounded p-1 text-xs mt-1"
                          value={act.options} onChange={e => updateActivity(actIdx, 'options', e.target.value)} />
                      </div>
                      <div>
                        {/* ✅ THIS IS THE KEY MISSING FIELD */}
                        <label className="text-[10px] font-bold text-red-500 uppercase">Correct Answer ★</label>
                        <input type="text" placeholder="Exact correct answer (must match one option)" className="w-full border border-red-200 rounded p-1 text-xs mt-1 focus:ring-2 focus:ring-red-200 outline-none"
                          value={act.correctAnswer} onChange={e => updateActivity(actIdx, 'correctAnswer', e.target.value)} />
                      </div>
                    </>
                  )}

                  {/* DRAG & DROP fields */}
                  {act.activityType === 'drag-drop' && (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Left Label</label>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Right Match</label>
                      </div>
                      {act.matchPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="e.g. Capital of France" className="border rounded p-1 text-xs"
                            value={pair.left} onChange={e => updateMatchPair(actIdx, pIdx, 'left', e.target.value)} />
                          <input type="text" placeholder="e.g. Paris" className="border rounded p-1 text-xs"
                            value={pair.right} onChange={e => updateMatchPair(actIdx, pIdx, 'right', e.target.value)} />
                        </div>
                      ))}
                      <button type="button" onClick={() => addMatchPair(actIdx)}
                        className="text-[9px] bg-gray-100 hover:bg-gray-200 p-1 rounded w-fit">+ Add Pair</button>
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={addActivity}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold p-2 rounded transition-colors">
                + Add Activity
              </button>
            </div>

            <button type="submit" disabled={isUploading}
              className={`p-3 rounded-lg text-white font-bold transition-colors ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {isUploading ? 'Uploading...' : 'Publish Course'}
            </button>

          </form>
        </div>
      </div>
    </StudentLayout>
  );
};

export default UploadCourse;