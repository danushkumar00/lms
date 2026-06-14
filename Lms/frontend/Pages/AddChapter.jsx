import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

const AddChapter = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Dynamic Array Parameters
  const [activityType, setActivityType] = useState('fill-blanks');
  const [fillBlanks, setFillBlanks] = useState([{ question: '', options: '', correctAnswer: '' }]);
  const [matchPairs, setMatchPairs] = useState([{ left: '', right: '' }]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/courses').then(res => {
      setCourses(res.data);
      if (res.data.length > 0) setSelectedCourseId(res.data[0]._id);
    });
  }, []);

  const addBlankRow = () => setFillBlanks([...fillBlanks, { question: '', options: '', correctAnswer: '' }]);
  const removeBlankRow = (index) => setFillBlanks(fillBlanks.filter((_, i) => i !== index));
  const updateBlankRow = (index, field, value) => {
    const updated = [...fillBlanks];
    updated[index][field] = value;
    setFillBlanks(updated);
  };

  const addMatchRow = () => setMatchPairs([...matchPairs, { left: '', right: '' }]);
  const removeMatchRow = (index) => setMatchPairs(matchPairs.filter((_, i) => i !== index));
  const updateMatchRow = (index, field, value) => {
    const updated = [...matchPairs];
    updated[index][field] = value;
    setMatchPairs(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !videoFile) return alert("Verify all mandatory input paths.");

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
    payload.append('chapterTitle', chapterTitle);
    payload.append('video', videoFile);
    payload.append('activityData', JSON.stringify(activityPayload));

    try {
      setIsUploading(true);
      await axios.post(`http://localhost:5001/api/courses/${selectedCourseId}/add-chapter`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Lesson Module appended to curriculum roadmap successfully!");
      navigate('/trainer-dashboard');
    } catch (err) {
      alert("Error parsing network media uploads.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-2xl rounded-xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Add Chapter & Quiz Challenge</h2>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Target Mapping Route</label>
              <select className="w-full border rounded-lg p-2 bg-white outline-none" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Chapter Name</label>
              <input type="text" required className="w-full border rounded-lg p-2.5 outline-none" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Video Asset</label>
              <input type="file" accept="video/*" required className="w-full text-xs cursor-pointer" onChange={e => setVideoFile(e.target.files[0])} />
            </div>

            {/* DYNAMIC QUESTION WRAPPER FIELDS */}
            <div className="bg-purple-50/40 p-5 rounded-xl border border-purple-100 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-purple-900">Activity Blueprint Configurer</h4>
                <select className="border rounded p-1 text-xs bg-white font-medium outline-none" value={activityType} onChange={e => setActivityType(e.target.value)}>
                  <option value="fill-blanks">Fill in the Blanks (N)</option>
                  <option value="drag-drop">Drag Drop Column Match (N)</option>
                </select>
              </div>

              {activityType === 'fill-blanks' && (
                <div className="flex flex-col gap-3">
                  {fillBlanks.map((row, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border flex flex-col gap-2 relative">
                      <div className="flex justify-between text-xs font-bold text-purple-700">
                        <span>Blank Entry Sentence #{idx + 1}</span>
                        {fillBlanks.length > 1 && <button type="button" onClick={() => removeBlankRow(idx)} className="text-red-500 hover:underline">Delete</button>}
                      </div>
                      <input type="text" placeholder="Question prompt context (with '___')" required className="border rounded p-1.5 text-xs outline-none" value={row.question} onChange={e => updateBlankRow(idx, 'question', e.target.value)} />
                      <input type="text" placeholder="Options (comma separated string tokens)" required className="border rounded p-1.5 text-xs outline-none" value={row.options} onChange={e => updateBlankRow(idx, 'options', e.target.value)} />
                      <input type="text" placeholder="Explicit value correct answer string" required className="border rounded p-1.5 text-xs outline-none" value={row.correctAnswer} onChange={e => updateBlankRow(idx, 'correctAnswer', e.target.value)} />
                    </div>
                  ))}
                  <button type="button" onClick={addBlankRow} className="text-xs bg-purple-100 text-purple-700 font-bold p-1.5 rounded hover:bg-purple-200">+ Append Extra Blank Item</button>
                </div>
              )}

              {activityType === 'drag-drop' && (
                <div className="flex flex-col gap-2">
                  {matchPairs.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-2 border rounded shadow-sm">
                      <input type="text" placeholder="Left drag item" required className="w-1/2 border rounded p-1.5 text-xs outline-none" value={row.left} onChange={e => updateMatchRow(idx, 'left', e.target.value)} />
                      <input type="text" placeholder="Right target mapping match" required className="w-1/2 border rounded p-1.5 text-xs outline-none" value={row.right} onChange={e => updateMatchRow(idx, 'right', e.target.value)} />
                      {matchPairs.length > 1 && <button type="button" onClick={() => removeMatchRow(idx)} className="text-red-500 font-bold text-xs">X</button>}
                    </div>
                  ))}
                  <button type="button" onClick={addMatchRow} className="text-xs bg-purple-100 text-purple-700 font-bold p-1.5 rounded hover:bg-purple-200">+ Append Extra Relation Match Pair</button>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={() => navigate('/trainer-dashboard')} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
              <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg">
                {isUploading ? 'Streaming files...' : 'Append Chapter Module'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
};

export default AddChapter;