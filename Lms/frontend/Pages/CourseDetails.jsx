// frontend/src/pages/CourseDetails.jsx
import  { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import StudentLayout from '../src/layouts/StudentLayout';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [course, setCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  
  const [currentActiveQuiz, setCurrentActiveQuiz] = useState(null);
  const [clearedQuizIds, setClearedQuizIds] = useState(new Set());
  
  // Matrix matching states
  const [leftColumnItems, setLeftColumnItems] = useState([]);
  const [shuffledRightColumn, setShuffledRightColumn] = useState([]);
  const [matrixMatches, setMatrixMatches] = useState({}); // Stores { rightAnswerText: leftQuestionText }
  
  const [studentAnswer, setStudentAnswer] = useState(''); // Fallback for written blank fields
  const [feedback, setFeedback] = useState(null);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [chaptersState, setChaptersState] = useState([]);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchCourseData = () => {
    axios.get(`http://localhost:5001/api/courses/${id}`)
      .then(({ data }) => {
        setCourse(data); 
        setEditTitle(data.title);
        setEditDescription(data.description);
        
        const chaptersWithMinutes = (data.chapters || []).map(ch => ({
          ...ch,
          activities: ch.activities?.map(act => ({
            ...act,
            timestamp: act.timestamp / 60 
          })) || []
        }));
        setChaptersState(chaptersWithMinutes);
      })
      .catch(err => console.error("Data syncing error:", err));
  };

  useEffect(() => {
    if (id) fetchCourseData();
  }, [id]);

  const selectNewChapter = (idx) => {
    setActiveChapterIdx(idx);
    setCurrentActiveQuiz(null);
    setClearedQuizIds(new Set());
    resetQuizStates();
  };

  const resetQuizStates = () => {
    setMatrixMatches({});
    setStudentAnswer('');
    setFeedback(null);
  };

  const monitorPlaybackTimeline = () => {
    if (!videoRef.current || !course?.chapters[activeChapterIdx]) return;
    
    const currentSeconds = Math.floor(videoRef.current.currentTime);
    const targetActivities = course.chapters[activeChapterIdx].activities || [];

    const pendingChallenge = targetActivities.find(act => 
      act.timestamp === currentSeconds && !clearedQuizIds.has(act._id)
    );

    if (pendingChallenge && currentActiveQuiz?._id !== pendingChallenge._id) {
      videoRef.current.pause(); 
      setCurrentActiveQuiz(pendingChallenge);
      resetQuizStates();

      if (pendingChallenge.activityType === 'drag-drop') {
        const lefts = pendingChallenge.question.split(',').map(s => s.trim());
        const rights = Array.isArray(pendingChallenge.options) 
          ? pendingChallenge.options 
          : pendingChallenge.options.split(',').map(s => s.trim());
        
        setLeftColumnItems(lefts);
        // Shuffle right column items so they aren't directly across from their match
        setShuffledRightColumn([...rights].sort(() => Math.random() - 0.5));
      }
    }
  };

  const verifyActivitySolution = () => {
    if (!currentActiveQuiz) return;

    if (currentActiveQuiz.activityType === 'drag-drop') {
      const lefts = currentActiveQuiz.question.split(',').map(s => s.trim());
      // correct answers array maps 1:1 with left array indexes
      const corrects = Array.isArray(currentActiveQuiz.correctAnswer)
        ? currentActiveQuiz.correctAnswer
        : currentActiveQuiz.correctAnswer.split(',').map(s => s.trim());

      // Check if total match boxes are completed
      if (Object.keys(matrixMatches).length < lefts.length) {
        alert("Please connect all variables before submittal verification!");
        return;
      }

      let passesAllRules = true;
      for (let i = 0; i < lefts.length; i++) {
        const standardLeftItem = lefts[i];
        const requiredRightAnswer = corrects[i];
        
        if (matrixMatches[requiredRightAnswer] !== standardLeftItem) {
          passesAllRules = false;
          break;
        }
      }

      if (passesAllRules) {
        setFeedback('correct');
        setClearedQuizIds(prev => new Set([...prev, currentActiveQuiz._id]));
        setTimeout(() => {
          setCurrentActiveQuiz(null);
          setFeedback(null);
          if (videoRef.current) videoRef.current.play(); 
        }, 1500);
      } else {
        setFeedback('wrong');
      }
    } else {
      // Standard line fill implementation
      if (studentAnswer.trim().toLowerCase() === currentActiveQuiz.correctAnswer.toString().trim().toLowerCase()) {
        setFeedback('correct');
        setClearedQuizIds(prev => new Set([...prev, currentActiveQuiz._id]));
        setTimeout(() => {
          setCurrentActiveQuiz(null);
          setFeedback(null);
          if (videoRef.current) videoRef.current.play(); 
        }, 1500);
      } else {
        setFeedback('wrong');
      }
    }
  };

  const handleDropOnTargetBox = (e, targetAnswerText) => {
    e.preventDefault();
    const draggedQuestionText = e.dataTransfer.getData("text/plain");
    
    // Clean old bindings of this dragged question text if it was dropped elsewhere previously
    const updatedMatches = { ...matrixMatches };
    Object.keys(updatedMatches).forEach(key => {
      if (updatedMatches[key] === draggedQuestionText) {
        delete updatedMatches[key];
      }
    });

    updatedMatches[targetAnswerText] = draggedQuestionText;
    setMatrixMatches(updatedMatches);
  };

  const modifyChapterActivityField = (chIdx, actIdx, key, val) => {
    const freshState = [...chaptersState];
    freshState[chIdx].activities[actIdx][key] = val;
    setChaptersState(freshState);
  };

  const removeActivityFromChapterState = (chIdx, actIdx) => {
    const freshState = [...chaptersState];
    freshState[chIdx].activities = freshState[chIdx].activities.filter((_, idx) => idx !== actIdx);
    setChaptersState(freshState);
  };

  const appendNewBlankActivityToState = (chIdx) => {
    const freshState = [...chaptersState];
    if (!freshState[chIdx].activities) freshState[chIdx].activities = [];
    freshState[chIdx].activities.push({
      timestamp: 0, 
      activityType: 'drag-drop',
      question: '',
      options: '',
      correctAnswer: ''
    });
    setChaptersState(freshState);
  };

  const removeChapterEntirely = async (chIdx, chId, publicId) => {
    if (!window.confirm("Delete this chapter?")) return;
    const cleanPublicId = publicId.split('/').pop();
    try {
      setProcessing(true);
      await axios.delete(`http://localhost:5001/api/courses/${id}/chapter/${chId}/${cleanPublicId}`);
      alert("Chapter record deleted successfully.");
      fetchCourseData();
    } catch (err) {
      alert("Error dropping asset arrays.");
      console.log(err)
    } finally {
      setProcessing(false);
    }
  };

  const submitOverwrittenDatabaseSpecs = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('title', editTitle);
    payload.append('description', editDescription);

    const normalizedChapters = chaptersState.map(ch => ({
      ...ch,
      activities: ch.activities?.map(act => ({
        ...act,
        timestamp: Number(act.timestamp) * 60, 
        options: Array.isArray(act.options) ? act.options : String(act.options).split(',').map(o => o.trim()),
        correctAnswer: Array.isArray(act.options) ? act.options.join(',') : String(act.options)
      }))
    }));

    payload.append('chapters', JSON.stringify(normalizedChapters));

    if (replaceIndex !== null && newVideoFile) {
      payload.append('replaceIndex', replaceIndex);
      payload.append('video', newVideoFile);
    }

    try {
      setProcessing(true);
      await axios.put(`http://localhost:5001/api/courses/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Configurations synchronized!");
      setIsEditing(false);
      setReplaceIndex(null);
      setNewVideoFile(null);
      fetchCourseData();
    } catch (err) {
      alert("Error saving properties.");
      console.log(err)
    } finally {
      setProcessing(false);
    }
  };

  if (!course) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
          Loading course blueprints...
        </div>
      </StudentLayout>
    );
  }

  const activeChapter = course.chapters[activeChapterIdx];

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-5">
          
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/trainer-dashboard')} className="font-semibold text-sm text-blue-600">&larr; Back Dashboard Hub</button>
            <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border rounded-lg shadow-sm">
              {isEditing ? '🔌 Show View Presentation Monitor' : '⚙️ Manage Activities & Core Elements'}
            </button>
          </div>

          {!isEditing ? (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-gray-500 text-sm">{course.description}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border">
                  <h2 className="font-bold mb-3 text-base text-gray-800">Chapter {activeChapterIdx + 1}: {activeChapter?.title}</h2>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-inner">
                    {activeChapter && (
                      <video 
                        ref={videoRef}
                        onTimeUpdate={monitorPlaybackTimeline}
                        controls 
                        src={activeChapter.videoUrl} 
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border min-h-[385px] flex flex-col justify-between">
                  {!currentActiveQuiz ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 my-auto text-gray-400">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-dotted animate-spin mb-3"></div>
                      <p className="text-xs font-bold text-gray-700">Timeline Stream Monitor Active</p>
                      <p className="text-[11px] max-w-[190px] mt-1 text-gray-400">Video pauses when a matrix challenge triggers.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                      <span className="bg-amber-100 text-amber-800 text-[9px] uppercase font-black w-fit px-2 py-0.5 rounded animate-pulse">
                        ⚠️ Checkpoint Challenge Activated
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {currentActiveQuiz.activityType === 'drag-drop' ? '🤝 Drag Left Items to Right Answers' : '✍️ Complete the Phrase Given'}
                      </h3>

                      {currentActiveQuiz.activityType === 'drag-drop' ? (
                        <div className="flex flex-col gap-4">
                          <p className="text-[11px] text-gray-400 font-medium">Match each term on the left with its partner on the right:</p>
                          
                          <div className="grid grid-cols-2 gap-4 items-center">
                            {/* Left Side: Drag Sources */}
                            <div className="flex flex-col gap-2.5">
                              <span className="text-[10px] text-center font-bold text-gray-400 uppercase">Terms</span>
                              {leftColumnItems.map((item, idx) => {
                                // Check if this item is currently assigned to any right box
                                const isAssigned = Object.values(matrixMatches).includes(item);
                                return (
                                  <div
                                    key={idx}
                                    draggable={!isAssigned}
                                    onDragStart={e => e.dataTransfer.setData("text/plain", item)}
                                    className={`p-2 border text-center text-xs font-bold rounded-xl shadow-sm transition-all select-none ${
                                      isAssigned 
                                        ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed line-through shadow-none' 
                                        : 'bg-indigo-50 border-indigo-200 text-indigo-900 cursor-grab active:cursor-grabbing hover:bg-indigo-100'
                                    }`}
                                  >
                                    {item}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right Side: Landing Boxes */}
                            <div className="flex flex-col gap-2.5">
                              <span className="text-[10px] text-center font-bold text-gray-400 uppercase">Answers</span>
                              {shuffledRightColumn.map((ansText, idx) => {
                                const assignedLeftItem = matrixMatches[ansText];
                                return (
                                  <div
                                    key={idx}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => handleDropOnTargetBox(e, ansText)}
                                    className={`p-2 border-2 rounded-xl flex flex-col items-center justify-center min-h-[64px] text-center transition-all ${
                                      assignedLeftItem 
                                        ? 'border-emerald-400 bg-emerald-50/10' 
                                        : 'border-dashed border-slate-300 bg-slate-50 hover:border-amber-400'
                                    }`}
                                  >
                                    <span className="text-[11px] font-bold text-slate-800 mb-1">{ansText}</span>
                                    {assignedLeftItem ? (
                                      <span 
                                        onClick={() => {
                                          const cleared = { ...matrixMatches };
                                          delete cleared[ansText];
                                          setMatrixMatches(cleared);
                                        }}
                                        className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded cursor-pointer hover:bg-red-500 shadow-sm"
                                        title="Click to remove connection"
                                      >
                                        ⬅️ {assignedLeftItem}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-400 tracking-tight">Drop Match Here</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-gray-600 leading-relaxed">{currentActiveQuiz.question.replace('___', '______')}</p>
                          <input type="text" placeholder="Type answer..." className="w-full border rounded-lg p-2 text-xs outline-none shadow-inner" value={studentAnswer} onChange={e => setStudentAnswer(e.target.value)} />
                        </div>
                      )}

                      <button onClick={verifyActivitySolution} className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg mt-2 shadow-sm hover:bg-slate-800">Submit Validation</button>
                      {feedback === 'correct' && <div className="p-3 bg-emerald-100 border text-emerald-800 text-xs font-bold rounded-lg animate-bounce">🎉 Complete Success! Stream Unlocking...</div>}
                      {feedback === 'wrong' && <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg">❌ Combinations mismatched. Try re-assigning variables.</div>}
                    </div>
                  )}
                </div>
              </div>

              <section className="bg-white rounded-xl p-5 border shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 border-b pb-2 text-sm">Program Curriculum Syllabus</h3>
                <div className="flex flex-col gap-2">
                  {course.chapters?.map((ch, idx) => (
                    <div key={ch._id || idx} onClick={() => selectNewChapter(idx)} className={`p-3 rounded-lg flex justify-between items-center text-xs font-medium cursor-pointer transition-all ${activeChapterIdx === idx ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900 font-bold' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <span>Chapter {idx + 1}: {ch.title}</span>
                      <span className="text-[10px] bg-white border px-2 py-0.5 rounded text-gray-400 font-bold uppercase">{ch.activities?.length || 0} Events Linked</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <form onSubmit={submitOverwrittenDatabaseSpecs} className="bg-white rounded-xl p-6 border shadow-sm flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Curriculum Layout Modification Matrix</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Global Track Title</label>
                  <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Global Narrative Description</label>
                  <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none" value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-2">
                <h3 className="font-bold text-xs text-gray-700 border-b pb-1 uppercase tracking-wider">Dynamic Component Chapter Bundles</h3>
                
                {chaptersState.map((ch, chIdx) => (
                  <div key={ch._id || chIdx} className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-sm text-slate-800">Chapter Module {chIdx + 1}: {ch.title}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setReplaceIndex(chIdx)} className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Replace Video File</button>
                        <button type="button" onClick={() => removeChapterEntirely(chIdx, ch._id, ch.publicId)} className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded">Remove Full Chapter</button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 bg-white p-4 rounded-lg border shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-purple-900 uppercase">Interactive Timestamp Events Map ({ch.activities?.length || 0})</span>
                        <button type="button" onClick={() => appendNewBlankActivityToState(chIdx)} className="text-[11px] font-bold bg-purple-600 text-white px-2.5 py-1 rounded-md shadow-sm">+ Insert New Timed Question</button>
                      </div>

                      <div className="flex flex-col gap-3 mt-1">
                        {ch.activities?.map((act, actIdx) => (
                          <div key={act._id || actIdx} className="p-3 bg-purple-50/20 rounded-md border border-purple-100 flex flex-col gap-2 relative">
                            <button type="button" onClick={() => removeActivityFromChapterState(chIdx, actIdx)} className="absolute top-2 right-2 text-[10px] font-bold text-red-500 hover:underline">Delete Activity</button>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-400 font-bold block mb-0.5">Trigger (Minutes)</label>
                                <input type="number" step="any" placeholder="e.g. 2.5" className="border rounded p-1 text-xs w-full bg-white outline-none" value={act.timestamp} onChange={e => modifyChapterActivityField(chIdx, actIdx, 'timestamp', e.target.value)} required />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 font-bold block mb-0.5">Type Structure</label>
                                <select className="border rounded p-1 text-xs w-full bg-white outline-none" value={act.activityType} onChange={e => modifyChapterActivityField(chIdx, actIdx, 'activityType', e.target.value)}>
                                  <option value="drag-drop">Drag Drop Matrix</option>
                                  <option value="fill-blanks">Fill Blanks</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-400 font-bold block mb-0.5">
                                  {act.activityType === 'drag-drop' ? 'Left Column Items (separated by commas)' : 'Question Prompt'}
                                </label>
                                <input type="text" className="border rounded p-1.5 text-xs w-full bg-white outline-none" value={act.question} onChange={e => modifyChapterActivityField(chIdx, actIdx, 'question', e.target.value)} required />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 font-bold block mb-0.5">
                                  {act.activityType === 'drag-drop' ? 'Right Column Matching Answers (separated by commas)' : 'Choices options'}
                                </label>
                                <input type="text" className="border rounded p-1.5 text-xs w-full bg-white outline-none" value={act.options} onChange={e => modifyChapterActivityField(chIdx, actIdx, 'options', e.target.value)} required />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {replaceIndex !== null && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900">
                  ⚠️ Target scheduling replacement active for Chapter row: {replaceIndex + 1}
                  <input type="file" accept="video/*" required className="w-full text-xs text-gray-500 cursor-pointer mt-2" onChange={e => setNewVideoFile(e.target.files[0])} />
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={() => { setIsEditing(false); setReplaceIndex(null); }} className="px-4 py-2 text-xs border rounded-lg">Cancel Form Overwrites</button>
                <button type="submit" disabled={processing} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-sm">
                  {processing ? 'Processing...' : 'Save Unified System Blueprint'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </StudentLayout>
  );
};

export default CourseDetails;