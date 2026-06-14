import { useState, useEffect } from 'react';
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
  
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/courses')
      .then(res => {
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourseId(res.data[0]._id);
      });
  }, []);

  const addEmptyActivityField = () => {
    setActivities([...activities, { timestamp: 0, activityType: 'drag-drop', question: '', options: '', correctAnswer: '' }]);
  };

  const updateActivityInput = (index, key, value) => {
    const updated = [...activities];
    updated[index][key] = value;
    setActivities(updated);
  };

  const deleteActivityField = (index) => {
    setActivities(activities.filter((_, idx) => idx !== index));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !videoFile) return alert("Verify target catalog configuration arrays.");

    const payload = new FormData();
    payload.append('chapterTitle', chapterTitle);
    payload.append('video', videoFile);

    const structuredActivities = activities.map(act => ({
      ...act,
      timestamp: Number(act.timestamp),
      options: act.options.split(',').map(o => o.trim())
    }));
    payload.append('activities', JSON.stringify(structuredActivities));

    try {
      setIsUploading(true);
      await axios.post(`http://localhost:5001/api/courses/${selectedCourseId}/add-chapter`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Module Chapter successfully appended.");
      navigate('/trainer-dashboard');
    } catch (err) {
      alert("Error attaching file structures.");
      console.log(err)
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-2xl rounded-xl p-8 border shadow-sm">
          <h2 className="text-xl font-bold mb-5 text-gray-900">Add Chapter Track Node</h2>
          
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Target Mapping Association</label>
              <select className="w-full border rounded-lg p-2.5 bg-white text-sm outline-none" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Sub-Module Title</label>
                <input type="text" required className="w-full border rounded-lg p-2.5 text-sm outline-none" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Media Payload Asset File</label>
                <input type="file" accept="video/*" required className="w-full text-xs text-gray-500 cursor-pointer mt-2" onChange={e => setVideoFile(e.target.files[0])} />
              </div>
            </div>

            <div className="bg-purple-50/30 p-5 rounded-xl border border-purple-100 mt-2">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-xs uppercase text-purple-900 tracking-wide">Attach Synchronized Interactive Events</h4>
                <button type="button" onClick={addEmptyActivityField} className="text-xs font-bold bg-purple-600 text-white px-3 py-1.5 rounded-md shadow">+ Add Checkpoint</button>
              </div>

              <div className="flex flex-col gap-4">
                {activities.map((act, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border flex flex-col gap-3 relative shadow-sm">
                    <button type="button" onClick={() => deleteActivityField(index)} className="absolute top-2 right-2 text-xs text-red-500 font-bold hover:underline">Remove</button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input type="number" required placeholder="Time (Seconds)" className="border rounded p-1.5 text-xs outline-none" value={act.timestamp} onChange={e => updateActivityInput(index, 'timestamp', e.target.value)} />
                      <select className="border rounded p-1.5 text-xs bg-white outline-none" value={act.activityType} onChange={e => updateActivityInput(index, 'activityType', e.target.value)}>
                        <option value="drag-drop">Drag and Drop</option>
                        <option value="fill-blanks">Fill Blanks</option>
                      </select>
                      <input type="text" required placeholder="Correct Key Token" className="border rounded p-1.5 text-xs outline-none" value={act.correctAnswer} onChange={e => updateActivityInput(index, 'correctAnswer', e.target.value)} />
                    </div>
                    <input type="text" required placeholder="Question structure pattern line (Using '___' bounds marker flags)" className="border rounded p-2 text-xs outline-none" value={act.question} onChange={e => updateActivityInput(index, 'question', e.target.value)} />
                    <input type="text" required placeholder="Multiple answer options separated explicitly with commas" className="border rounded p-2 text-xs outline-none" value={act.options} onChange={e => updateActivityInput(index, 'options', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => navigate('/trainer-dashboard')} className="px-4 py-2 text-xs border rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isUploading} className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg shadow">
                {isUploading ? 'Compiling File Modules...' : 'Save New Core Module'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
};

export default AddChapter;