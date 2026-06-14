// frontend/src/pages/StudentCourseView.jsx
import  { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../layouts/StudentLayout';

const StudentCourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  
  // Quiz verification states
  const [currentActiveQuiz, setCurrentActiveQuiz] = useState(null);
  const [clearedQuizIds, setClearedQuizIds] = useState(new Set());
  
  // Drag and drop matrix matching layouts
  const [leftColumnItems, setLeftColumnItems] = useState([]);
  const [shuffledRightColumn, setShuffledRightColumn] = useState([]);
  const [matrixMatches, setMatrixMatches] = useState({}); // Mappings: { rightAnswerText: leftQuestionText }
  
  const [studentAnswer, setStudentAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // 1. Strict Security Boundary Check
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'student') {
        alert("Access Denied: This terminal is reserved strictly for Student IDs.");
        navigate('/login');
        return;
      }
    } catch (e) {
      console.error("Malformed user token segment:", e);
      localStorage.clear();
      navigate('/login');
      return;
    }

    // 2. Fetch Core Course Payload
    axios.get(`http://localhost:5001/api/courses/${id}`)
      .then(({ data }) => {
        setCourse(data);
      })
      .catch(err => console.error("Error streaming core course assets:", err));
  }, [id, navigate]);

  const resetQuizStates = () => {
    setMatrixMatches({});
    setStudentAnswer('');
    setFeedback(null);
  };

  const handleSelectChapter = (idx) => {
    setActiveChapterIdx(idx);
    setCurrentActiveQuiz(null);
    resetQuizStates();
  };

  const monitorPlaybackTimeline = () => {
    if (!videoRef.current || !course?.chapters[activeChapterIdx]) return;

    const currentSeconds = Math.floor(videoRef.current.currentTime);
    const targetActivities = course.chapters[activeChapterIdx].activities || [];

    // Identify matching timestamp events that haven't been cleared yet
    const pendingChallenge = targetActivities.find(act => 
      Math.floor(act.timestamp) === currentSeconds && !clearedQuizIds.has(act._id)
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
        // Randomize alternative placements so matching options aren't flatly parallel
        setShuffledRightColumn([...rights].sort(() => Math.random() - 0.5));
      }
    }
  };

  // Triggers when a chapter video completes playback successfully
  const handleChapterVideoEnded = () => {
    if (!course) return;
    
    const completedList = JSON.parse(localStorage.getItem(`completed_chapters_${id}`) || "[]");
    const currentChapterId = course.chapters[activeChapterIdx]._id;

    if (!completedList.includes(currentChapterId)) {
      completedList.push(currentChapterId);
      localStorage.setItem(`completed_chapters_${id}`, JSON.stringify(completedList));
      // Force UI update to show completion checkmarks
      setCourse({ ...course }); 
      alert("🎉 Chapter module finished! Progress saved successfully.");
    }
  };

  const verifyActivitySolution = () => {
    if (!currentActiveQuiz) return;

    if (currentActiveQuiz.activityType === 'drag-drop') {
      const lefts = currentActiveQuiz.question.split(',').map(s => s.trim());
      const corrects = Array.isArray(currentActiveQuiz.correctAnswer)
        ? currentActiveQuiz.correctAnswer
        : currentActiveQuiz.correctAnswer.split(',').map(s => s.trim());

      if (Object.keys(matrixMatches).length < lefts.length) {
        alert("Please map out choices across all row parameters first!");
        return;
      }

      let passesAllRules = true;
      for (let i = 0; i < lefts.length; i++) {
        // Validation tracks matches through correct index pairs setup by the trainer backend
        if (matrixMatches[corrects[i]] !== lefts[i]) {
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
      // Inline filling assessment logic
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

    const updatedMatches = { ...matrixMatches };
    
    // Clear pre-existing references if an option is dragged elsewhere inside the viewport
    Object.keys(updatedMatches).forEach(key => {
      if (updatedMatches[key] === draggedQuestionText) {
        delete updatedMatches[key];
      }
    });

    updatedMatches[targetAnswerText] = draggedQuestionText;
    setMatrixMatches(updatedMatches);
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm font-medium">
        Loading curriculum workspace pipeline...
      </div>
    );
  }

  const activeChapter = course.chapters[activeChapterIdx];
  const completedChaptersList = JSON.parse(localStorage.getItem(`completed_chapters_${id}`) || "[]");

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-5">
          
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/student-dashboard')} 
              className="font-bold text-xs text-slate-600 hover:text-slate-900 bg-white border px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              &larr; Return to Dashboard Hub
            </button>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{course.title}</h1>
            <p className="text-gray-500 text-xs mt-0.5 max-w-3xl leading-relaxed">{course.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Media Column Block */}
            <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border flex flex-col gap-3">
              <h2 className="font-bold text-sm text-gray-800">
                Current Module: {activeChapter ? activeChapter.title : 'No Active Chapters Asset Mapped'}
              </h2>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative border shadow-inner">
                {activeChapter ? (
                  <video
                    ref={videoRef}
                    onTimeUpdate={monitorPlaybackTimeline}
                    onEnded={handleChapterVideoEnded}
                    controls
                    src={activeChapter.videoUrl}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    No active streaming assets are currently bound to this curriculum slot.
                  </div>
                )}
              </div>
            </div>

            {/* Right Activity Widget Column */}
            <div className="bg-white rounded-xl p-5 shadow-sm border min-h-[350px] flex flex-col justify-between">
              {!currentActiveQuiz ? (
                <div className="flex flex-col items-center justify-center text-center p-6 my-auto text-gray-400">
                  <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-dotted animate-spin mb-3"></div>
                  <p className="text-xs font-bold text-gray-700">Timeline Activity Monitor Active</p>
                  <p className="text-[11px] max-w-[200px] mt-1 text-gray-400">
                    Playback is active. The stream pauses automatically when checkpoint challenges approach.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <span className="bg-amber-100 text-amber-800 text-[9px] uppercase font-black w-fit px-2 py-0.5 rounded tracking-wide animate-pulse">
                    ⚠️ Interactive Checkpoint Triggered
                  </span>
                  
                  <h3 className="font-bold text-gray-900 text-xs">
                    {currentActiveQuiz.activityType === 'drag-drop' 
                      ? '🤝 Column Matching Matrix' 
                      : '✍️ Fill Missing Word Blanks'}
                  </h3>

                  {currentActiveQuiz.activityType === 'drag-drop' ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] text-gray-400 font-medium">Drag items from left into matching answer blocks:</p>
                      
                      <div className="grid grid-cols-2 gap-3 items-start">
                        {/* Left Terms Column */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-wider">Terms</span>
                          {leftColumnItems.map((item, idx) => {
                            const isAssigned = Object.values(matrixMatches).includes(item);
                            return (
                              <div
                                key={idx}
                                draggable={!isAssigned}
                                onDragStart={e => e.dataTransfer.setData("text/plain", item)}
                                className={`p-2 border text-center text-[11px] font-bold rounded-lg transition-all ${
                                  isAssigned
                                    ? 'bg-gray-100 border-gray-200 text-gray-300 line-through cursor-not-allowed shadow-none'
                                    : 'bg-indigo-50 border-indigo-200 text-indigo-900 cursor-grab active:cursor-grabbing hover:bg-indigo-100'
                                }`}
                              >
                                {item}
                              </div>
                            );
                          })}
                        </div>

                        {/* Right Landing Targets Column */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-wider">Answers</span>
                          {shuffledRightColumn.map((ansText, idx) => {
                            const assignedLeftItem = matrixMatches[ansText];
                            return (
                              <div
                                key={idx}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => handleDropOnTargetBox(e, ansText)}
                                className={`p-1.5 border rounded-xl flex flex-col items-center justify-center min-h-[58px] text-center transition-all ${
                                  assignedLeftItem
                                    ? 'border-emerald-400 bg-emerald-50/10'
                                    : 'border-dashed border-slate-300 bg-slate-50 hover:border-amber-400'
                                }`}
                              >
                                <span className="text-[11px] font-bold text-slate-800 mb-0.5">{ansText}</span>
                                {assignedLeftItem ? (
                                  <span
                                    onClick={() => {
                                      const cleared = { ...matrixMatches };
                                      delete cleared[ansText];
                                      setMatrixMatches(cleared);
                                    }}
                                    className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded cursor-pointer hover:bg-red-500 transition-all shadow-sm"
                                    title="Click to remove linkage"
                                  >
                                    ⬅️ {assignedLeftItem}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400">Drop Match</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-dashed">
                        {currentActiveQuiz.question.replace('___', '______')}
                      </p>
                      <input
                        type="text"
                        placeholder="Type standard response..."
                        className="w-full border rounded-lg p-2 text-xs outline-none shadow-inner"
                        value={studentAnswer}
                        onChange={e => setStudentAnswer(e.target.value)}
                      />
                    </div>
                  )}

                  <button 
                    onClick={verifyActivitySolution} 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg mt-2 shadow-sm transition-all"
                  >
                    Submit Verification Validation
                  </button>

                  {feedback === 'correct' && (
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg text-center border border-emerald-200">
                      🎉 Challenge Unlocked! Unpausing video streams...
                    </div>
                  )}
                  {feedback === 'wrong' && (
                    <div className="p-2.5 bg-red-50 text-red-800 text-[11px] font-semibold rounded-lg border border-red-100 text-center">
                      ❌ Evaluation mismatched. Verify dropped matching values.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Chapters Content Syllabus Progress Section */}
          <section className="bg-white rounded-xl p-5 border shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2 text-sm tracking-wide">Program Syllabus Tracker</h3>
            <div className="flex flex-col gap-2">
              {course.chapters?.map((ch, idx) => {
                const isCompleted = completedChaptersList.includes(ch._id);
                return (
                  <div
                    key={ch._id || idx}
                    onClick={() => handleSelectChapter(idx)}
                    className={`p-3 rounded-lg flex justify-between items-center text-xs font-medium cursor-pointer transition-all ${
                      activeChapterIdx === idx
                        ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-950 font-bold'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Chapter {idx + 1}: {ch.title}</span>
                      {isCompleted && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 bg-white border px-2 py-0.5 rounded font-bold uppercase">
                      {ch.activities?.length || 0} Events
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentCourseView;