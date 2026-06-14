import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

const UploadCourse = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', chapterTitle: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Dynamic Array Matrix State Structure
  const [activityType, setActivityType] = useState('fill-blanks');
  const [fillBlanks, setFillBlanks] = useState([{ question: '', options: '', correctAnswer: '' }]);
  const [matchPairs, setMatchPairs] = useState([{ left: '', right: '' }]);

  // Fill in Blanks Array Operations
  const addBlankRow = () => setFillBlanks([...fillBlanks, { question: '', options: '', correctAnswer: '' }]);
  const removeBlankRow = (index) => setFillBlanks(fillBlanks.filter((_, i) => i !== index));
  const updateBlankRow = (index, field, value) => {
    const updated = [...fillBlanks];
    updated[index][field] = value;
    setFillBlanks(updated);
  };

  // Drag-Drop Column Match Array Operations
  const addMatchRow = () => setMatchPairs([...matchPairs, { left: '', right: '' }]);
  const removeMatchRow = (index) => setMatchPairs(matchPairs.filter((_, i) => i !== index));
  const updateMatchRow = (index, field, value) => {
    const updated = [...matchPairs];
    updated[index][field] = value;
    setMatchPairs(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) return alert("Please upload a video file for Chapter 1.");

    // Cleanly process option strings to arrays for each fill-in-the-blank row
    const formattedBlanks = fillBlanks.map(item => ({
      ...item,
      options: item.options.split(',').map(o => o.trim()).filter(Boolean)
    }));

    const activityPayload = {
      activityType,
      fillBlanks: activityType === 'fill-blanks' ? formattedBlanks : [],
      matchPairs: activityType === 'drag-drop' ? matchPairs : []
    };

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('chapterTitle', formData.chapterTitle);
    payload.append('video', videoFile);
    payload.append('activityData', JSON.stringify(activityPayload));

    try {
      setIsUploading(true);
      await axios.post('http://localhost:5001/api/courses/create', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Course created successfully with custom activities!");
      navigate('/trainer-dashboard');
    } catch (err) {
      alert("Error building course mapping structures.");
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
              <h3 className="font-bold text-blue-900 text-sm">Chapter 1 Content Setup</h3>
              <div>
                <label className="block text-xs font-semibold mb-1">Chapter Target Name</label>
                <input type="text" required className="w-full bg-white border rounded-md p-2 text-sm outline-none" value={formData.chapterTitle} onChange={e => setFormData({...formData, chapterTitle: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Video File Asset</label>
                <input type="file" accept="video/*" required className="w-full text-xs text-gray-500 cursor-pointer" onChange={e => setVideoFile(e.target.files[0])} />
              </div>
            </div>

            {/* DYNAMIC MULTI-QUESTION CONFIGURATION */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-purple-900 text-sm">Activity Workspace Builder</h3>
                <select className="bg-white border rounded-md p-1.5 text-xs font-semibold outline-none" value={activityType} onChange={e => setActivityType(e.target.value)}>
                  <option value="fill-blanks">Multiple Fill-in-the-Blanks (N)</option>
                  <option value="drag-drop">Column Matching Pair Set (N)</option>
                </select>
              </div>

              {/* RENDER N FILL IN THE BLANKS OPTIONS */}
              {activityType === 'fill-blanks' && (
                <div className="flex flex-col gap-4">
                  {fillBlanks.map((row, idx) => (
                    <div key={idx} className="bg-white border p-4 rounded-lg relative flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-bold text-purple-700">
                        <span>Sentence Question #{idx + 1}</span>
                        {fillBlanks.length > 1 && (
                          <button type="button" onClick={() => removeBlankRow(idx)} className="text-red-500 hover:underline">Remove</button>
                        )}
                      </div>
                      <input type="text" placeholder="Question context (Use '___' for missing space)" required className="w-full border rounded p-2 text-xs outline-none" value={row.question} onChange={e => updateBlankRow(idx, 'question', e.target.value)} />
                      <input type="text" placeholder="Answer options bank (Separated by commas)" required className="w-full border rounded p-2 text-xs outline-none" value={row.options} onChange={e => updateBlankRow(idx, 'options', e.target.value)} />
                      <input type="text" placeholder="Exact Correct Word Key Match" required className="w-full border rounded p-2 text-xs outline-none" value={row.correctAnswer} onChange={e => updateBlankRow(idx, 'correctAnswer', e.target.value)} />
                    </div>
                  ))}
                  <button type="button" onClick={addBlankRow} className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold p-2 rounded-lg transition-colors">+ Append Next Blank Row Option</button>
                </div>
              )}

              {/* RENDER N MATCHING PAIRS OPTIONS */}
              {activityType === 'drag-drop' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-purple-900 px-1">
                    <span>Left Side (Draggable Word)</span>
                    <span>Right Side (Static Match Answer)</span>
                  </div>
                  {matchPairs.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-2 border rounded-lg shadow-sm">
                      <input type="text" placeholder="e.g. MongoDB" required className="w-1/2 border rounded p-2 text-xs outline-none" value={row.left} onChange={e => updateMatchRow(idx, 'left', e.target.value)} />
                      <input type="text" placeholder="e.g. NoSQL Database" required className="w-1/2 border rounded p-2 text-xs outline-none" value={row.right} onChange={e => updateMatchRow(idx, 'right', e.target.value)} />
                      {matchPairs.length > 1 && (
                        <button type="button" onClick={() => removeMatchRow(idx)} className="text-red-500 text-xs font-bold px-1 hover:underline">X</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addMatchRow} className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold p-2 rounded-lg transition-colors">+ Append New Matching Mapping Link</button>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={() => navigate('/trainer-dashboard')} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
              <button type="submit" disabled={isUploading} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold">
                {isUploading ? 'Uploading Video & Activities...' : 'Publish Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
};

export default UploadCourse;