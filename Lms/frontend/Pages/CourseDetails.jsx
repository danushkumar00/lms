import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  
  // Interactive Evaluation Activity State Managers
  const [videoFinished, setVideoFinished] = useState(false);
  const [blankAnswers, setBlankAnswers] = useState({}); // Mapping index -> user answers string
  const [columnMatches, setColumnMatches] = useState({}); // Mapping static right token -> dropped left token
  const [shuffledLeftItems, setShuffledLeftItems] = useState([]);
  const [activityFeedback, setActivityFeedback] = useState(null); 

  // Direct Course Management Editor Variables
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchActiveTrackData = () => {
    axios.get(`http://localhost:5001/api/courses/${id}`)
      .then(({ data }) => {
        setCourse(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        initializeStudentCanvas(data.chapters[activeChapterIdx]);
      })
      .catch((err) => console.error("Error linking file tables:", err));
  };

  useEffect(() => {
    axios.get(`http://localhost:5001/api/courses/${id}`).then(({ data }) => {
      setCourse(data);
      setEditTitle(data.title);
      setEditDescription(data.description);
      if (data.chapters?.length > 0) initializeStudentCanvas(data.chapters[0]);
    });
  }, [id]);

  const initializeStudentCanvas = (chapter) => {
    if (!chapter || !chapter.activity) return;
    setVideoFinished(false);
    setActivityFeedback(null);
    setBlankAnswers({});
    setColumnMatches({});

    // If it's a drag-drop match assignment, collect left choices and shuffle them cleanly
    if (chapter.activity.activityType === 'drag-drop') {
      const lefts = chapter.activity.matchPairs.map(p => p.left);
      setShuffledLeftItems([...lefts].sort(() => Math.random() - 0.5));
    }
  };

  const selectChapterModule = (index) => {
    setActiveChapterIdx(index);
    initializeStudentCanvas(course.chapters[index]);
  };

  // Evaluate Student Answers across N items
  const verifyChallengeSubmission = () => {
    const act = course.chapters[activeChapterIdx].activity;
    let isPerfect = true;

    if (act.activityType === 'fill-blanks') {
      act.fillBlanks.forEach((item, idx) => {
        const studentInput = blankAnswers[idx] || '';
        if (studentInput.trim().toLowerCase() !== item.correctAnswer.trim().toLowerCase()) {
          isPerfect = false;
        }
      });
    } else if (act.activityType === 'drag-drop') {
      act.matchPairs.forEach((pair) => {
        const assignedLeft = columnMatches[pair.right] || '';
        if (assignedLeft.trim().toLowerCase() !== pair.left.trim().toLowerCase()) {
          isPerfect = false;
        }
      });
    }

    setActivityFeedback(isPerfect ? 'correct' : 'wrong');
  };

  // Drag Drop Mechanics Handlers
  const handleDragStart = (e, leftWord) => {
    e.dataTransfer.setData("text/plain", leftWord);
  };

  const handleDropOnTarget = (e, targetRightDefinition) => {
    e.preventDefault();
    const droppedWord = e.dataTransfer.getData("text/plain");
    setColumnMatches(prev => ({
      ...prev,
      [targetRightDefinition]: droppedWord
    }));
  };

  // Edit State Chapter Modification Real-time updates
  const updateChapterActivityField = (chIdx, type, nestedIdx, field, val) => {
    const updatedChapters = [...course.chapters];
    if (type === 'fill-blanks') {
      updatedChapters[chIdx].activity.fillBlanks[nestedIdx][field] = val;
    } else if (type === 'match-pairs') {
      updatedChapters[chIdx].activity.matchPairs[nestedIdx][field] = val;
    } else if (type === 'meta') {
      updatedChapters[chIdx].title = val;
    }
    setCourse({ ...course, chapters: updatedChapters });
  };

  const addActivityRowInEditor = (chIdx, type) => {
    const updatedChapters = [...course.chapters];
    if (type === 'fill-blanks') {
      updatedChapters[chIdx].activity.fillBlanks.push({ question: '', options: [], correctAnswer: '' });
    } else if (type === 'match-pairs') {
      updatedChapters[chIdx].activity.matchPairs.push({ left: '', right: '' });
    }
    setCourse({ ...course, chapters: updatedChapters });
  };

  const deleteChapter = async (chapterId, fullPublicId) => {
    if (!window.confirm("Confirm deletion of this module?")) return;
    const cleanPublicId = fullPublicId.split('/').pop(); 
    try {
      setProcessing(true);
      await axios.delete(`http://localhost:5001/api/courses/${id}/chapter/${chapterId}/${cleanPublicId}`);
      alert("Chapter dropped successfully.");
      fetchActiveTrackData();
    } catch (err) {
      alert("Error dropping structural assets.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateCourseDetails = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('title', editTitle);
    payload.append('description', editDescription);
    payload.append('chaptersData', JSON.stringify(course.chapters));

    if (replaceIndex !== null && newVideoFile) {
      payload.append('replaceIndex', replaceIndex);
      payload.append('video', newVideoFile);
    }

    try {
      setProcessing(true);
      await axios.put(`http://localhost:5001/api/courses/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Course records updated successfully.");
      setIsEditing(false);
      setReplaceIndex(null);
      setNewVideoFile(null);
      fetchActiveTrackData();
    } catch (err) {
      alert("Error editing dashboard details.");
    } finally {
      setProcessing(false);
    }
  };

  if (!course) {
    return (
      <StudentLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 animate-pulse font-medium">Syncing interface files...</p>
        </div>
      </StudentLayout>
    );
  }

  const currentChapter = course.chapters[activeChapterIdx];

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-5">
          
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/trainer-dashboard')} className="font-semibold text-sm text-blue-600">&larr; Back to Admin Hub</button>
            <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border rounded-lg shadow-sm">
              {isEditing ? 'View Interactive Player' : 'Open Content Schema Editor'}
            </button>
          </div>

          {!isEditing ? (
            /* ================= MODE A: INTERACTIVE PRESENTATION LEARNER VIEW ================= */
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-gray-500 text-sm">{course.description}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Video Column Panel */}
                <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border">
                  <h2 className="font-bold mb-3 text-base text-gray-800">Chapter {activeChapterIdx + 1}: {currentChapter?.title}</h2>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
                    {currentChapter && (
                      <video 
                        key={currentChapter._id} controls src={currentChapter.videoUrl} className="w-full h-full object-contain"
                        onEnded={() => setVideoFinished(true)} 
                      />
                    )}
                  </div>
                </div>

                {/* Unlocked Activities Sidebar Container */}
                <div className="bg-white rounded-xl p-5 shadow-sm border min-h-[380px] flex flex-col justify-between">
                  {!videoFinished ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 my-auto text-gray-400">
                      <div className="w-10 h-10 rounded-full border-4 border-dashed border-gray-200 animate-spin mb-4"></div>
                      <p className="text-sm font-semibold text-gray-700">Challenge Workspace Locked</p>
                      <p className="text-xs max-w-[190px] mt-1">Finish this module video to unlock the verification checklist checkpoints.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-extrabold w-fit px-2 py-0.5 rounded">Syllabus Checkpoint</span>
                      
                      {/* SUB-VIEW 1: N NUMBER OF FILL IN THE BLANKS */}
                      {currentChapter?.activity?.activityType === 'fill-blanks' && (
                        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1">
                          <h3 className="font-bold text-xs text-gray-900">✍️ Complete all blanks sentences below:</h3>
                          {currentChapter.activity.fillBlanks.map((item, idx) => (
                            <div key={idx} className="border-b pb-3 flex flex-col gap-1.5">
                              <p className="text-xs text-gray-700 leading-relaxed font-medium">{idx + 1}. {item.question.replace('___', '______')}</p>
                              <input 
                                type="text" placeholder="Type answer..." 
                                className="w-full border rounded p-1.5 text-xs outline-none bg-gray-50 focus:bg-white"
                                value={blankAnswers[idx] || ''} 
                                onChange={e => setBlankAnswers({...blankAnswers, [idx]: e.target.value})} 
                              />
                              <div className="text-[10px] text-gray-400">Choices: {Array.isArray(item.options) ? item.options.join(', ') : item.options}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* SUB-VIEW 2: N NUMBER MATCH THE FOLLOWING GRID (DRAG & DROP) */}
                      {currentChapter?.activity?.activityType === 'drag-drop' && (
                        <div className="flex flex-col gap-3">
                          <h3 className="font-bold text-xs text-gray-900">🤝 Drag words from Left into their Right Target options:</h3>
                          
                          {/* Draggable Source Option Bank */}
                          <div className="flex flex-wrap gap-1.5 bg-gray-50 p-2 rounded-lg border border-dashed mb-2">
                            {shuffledLeftItems.map((word, index) => (
                              <div 
                                key={index} draggable onDragStart={e => handleDragStart(e, word)}
                                className="bg-white px-2 py-1 text-xs font-semibold rounded border shadow-sm cursor-grab active:cursor-grabbing text-purple-800 border-purple-200 hover:bg-purple-50"
                              >
                                {word}
                              </div>
                            ))}
                          </div>

                          {/* Two-Column Mapping Grid Workspace */}
                          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {currentChapter.activity.matchPairs.map((pair, idx) => (
                              <div key={idx} className="grid grid-cols-2 gap-2 items-center border p-2 rounded-lg bg-white shadow-xs">
                                {/* Left Drop Target Zone Slot */}
                                <div 
                                  onDragOver={e => e.preventDefault()} 
                                  onDrop={e => handleDropOnTarget(e, pair.right)}
                                  className="border border-dashed border-purple-300 bg-purple-50/20 text-purple-900 rounded p-1.5 text-center text-[11px] font-bold min-h-[32px] flex items-center justify-center"
                                >
                                  {columnMatches[pair.right] ? `🎯 ${columnMatches[pair.right]}` : 'Drop Match Here'}
                                </div>
                                {/* Right Static Match Key Label description */}
                                <div className="text-xs text-gray-600 font-medium pl-1 line-clamp-2 leading-tight">
                                  {pair.right}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button onClick={verifyChallengeSubmission} className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded-lg mt-2">Submit Verification Pack</button>
                      {activityFeedback === 'correct' && <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">🎉 Perfect! Knowledge node verified.</div>}
                      {activityFeedback === 'wrong' && <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg">❌ Mismatched values found. Try adjusting options.</div>}
                    </div>
                  )}
                </div>
              </div>

              <section className="bg-white rounded-xl p-5 border shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">Program Curriculum Syllabus Roadmap</h3>
                <div className="flex flex-col gap-2">
                  {course.chapters.map((ch, idx) => (
                    <div key={ch._id} onClick={() => selectChapterModule(idx)} className={`p-3 rounded-lg flex justify-between items-center text-sm font-medium cursor-pointer transition-all ${activeChapterIdx === idx ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <span>Chapter {idx + 1}: {ch.title}</span>
                      <span className="text-xs bg-white border px-2 py-0.5 rounded text-gray-400 capitalize">{ch.activity?.activityType === 'fill-blanks' ? 'Blanks List' : 'Matching Matrix'}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            /* ================= MODE B: ADVANCED CURRICULUM MANAGEMENT MASTER EDITOR ================= */
            <form onSubmit={handleUpdateCourseDetails} className="bg-white rounded-xl p-6 border shadow-sm flex flex-col gap-5">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Dynamic Specification Blueprint Form Editor</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Global Track Title</label>
                  <input type="text" className="w-full border rounded-lg p-2.5 text-sm outline-none" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Global Summary Description Narrative</label>
                  <input type="text" className="w-full border rounded-lg p-2.5 text-sm outline-none" value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
                </div>
              </div>

              {/* ITERATIVE SECTION FOR ADJUSTING AND SAVING N QUESTIONS DIRECTLY */}
              <div className="flex flex-col gap-6 mt-2 border-t pt-4">
                <h3 className="font-bold text-sm text-gray-800">Operational Module Configuration Matrix</h3>
                
                {course.chapters.map((ch, chIdx) => (
                  <div key={ch._id || chIdx} className="border rounded-xl p-4 bg-gray-50 flex flex-col gap-4">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border shadow-xs">
                      <div className="flex gap-2 items-center w-2/3">
                        <span className="text-xs font-extrabold text-blue-700">Ch {chIdx + 1}:</span>
                        <input type="text" className="border-b font-semibold text-xs outline-none bg-transparent w-full" value={ch.title} onChange={e => updateChapterActivityField(chIdx, 'meta', null, null, e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setReplaceIndex(chIdx)} className="text-[11px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded">Swap Video</button>
                        <button type="button" onClick={() => deleteChapter(ch._id, ch.publicId)} className="text-[11px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded">Drop Chapter</button>
                      </div>
                    </div>

                    {/* EDIT N BLANKS SUB-FORMS */}
                    {ch.activity?.activityType === 'fill-blanks' && (
                      <div className="pl-4 flex flex-col gap-3 border-l-2 border-purple-200">
                        <span className="text-[11px] font-bold text-purple-800">Dynamic Blanks Item Fields (N Number)</span>
                        {ch.activity.fillBlanks?.map((item, nestedIdx) => (
                          <div key={nestedIdx} className="bg-white p-3 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <input type="text" placeholder="Sentence ('___')" className="border rounded p-1.5 outline-none" value={item.question} onChange={e => updateChapterActivityField(chIdx, 'fill-blanks', nestedIdx, 'question', e.target.value)} />
                            <input type="text" placeholder="Choices (comma separated)" className="border rounded p-1.5 outline-none" value={Array.isArray(item.options) ? item.options.join(', ') : item.options} onChange={e => updateChapterActivityField(chIdx, 'fill-blanks', nestedIdx, 'options', e.target.value.split(','))} />
                            <input type="text" placeholder="Correct Token Match" className="border rounded p-1.5 outline-none" value={item.correctAnswer} onChange={e => updateChapterActivityField(chIdx, 'fill-blanks', nestedIdx, 'correctAnswer', e.target.value)} />
                          </div>
                        ))}
                        <button type="button" onClick={() => addActivityRowInEditor(chIdx, 'fill-blanks')} className="text-[10px] w-fit bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded">+ Add New Blank Sentence Row</button>
                      </div>
                    )}

                    {/* EDIT N MATCH PAIRS SUB-FORMS */}
                    {ch.activity?.activityType === 'drag-drop' && (
                      <div className="pl-4 flex flex-col gap-3 border-l-2 border-purple-200">
                        <span className="text-[11px] font-bold text-purple-800">Column Relation Match Pair Mappings (N Number)</span>
                        {ch.activity.matchPairs?.map((pair, nestedIdx) => (
                          <div key={nestedIdx} className="bg-white p-2 rounded-lg border grid grid-cols-2 gap-2 text-xs">
                            <input type="text" placeholder="Left Draggable Word" className="border rounded p-1.5 outline-none" value={pair.left} onChange={e => updateChapterActivityField(chIdx, 'match-pairs', nestedIdx, 'left', e.target.value)} />
                            <input type="text" placeholder="Right Target Definition" className="border rounded p-1.5 outline-none" value={pair.right} onChange={e => updateChapterActivityField(chIdx, 'match-pairs', nestedIdx, 'right', e.target.value)} />
                          </div>
                        ))}
                        <button type="button" onClick={() => addActivityRowInEditor(chIdx, 'match-pairs')} className="text-[10px] w-fit bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded">+ Add New Matching Connection Item</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {replaceIndex !== null && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col gap-1.5">
                  <p className="text-xs font-bold text-amber-900">Uploading new media asset container row to replace index: {replaceIndex + 1}</p>
                  <input type="file" accept="video/*" required className="text-xs cursor-pointer" onChange={e => setNewVideoFile(e.target.files[0])} />
                </div>
              )}

              <div className="flex gap-2 justify-end border-t pt-4">
                <button type="button" onClick={() => { setIsEditing(false); setReplaceIndex(null); }} className="px-4 py-2 text-xs border rounded-lg">Cancel Form Changes</button>
                <button type="submit" disabled={processing} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-sm">
                  {processing ? 'Processing Streams...' : 'Save Unified Curriculum Schema Changes'}
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