import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

// ── localStorage helpers ──────────────────────────────────────────────────────
const getProgressStore = () => JSON.parse(localStorage.getItem('lms_progress') || '{}');
const markChapterComplete = (userId, courseId, chapterIdx) => {
  const store = getProgressStore();
  const key = `${userId}:${courseId}`;
  const completed = new Set(store[key] || []);
  completed.add(chapterIdx);
  store[key] = [...completed];
  localStorage.setItem('lms_progress', JSON.stringify(store));
};
// ─────────────────────────────────────────────────────────────────────────────

const StudentCourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);

  const [currentActiveQuiz, setCurrentActiveQuiz] = useState(null);
  const [clearedQuizIds, setClearedQuizIds] = useState(new Set());

  // fill-blanks
  const [studentAnswer, setStudentAnswer] = useState('');

  // drag-drop
  const [shuffledOptions, setShuffledOptions] = useState([]); // answer bank, shuffled ONCE per quiz
  const [userMatches, setUserMatches] = useState({});         // { leftItem: droppedRightItem }

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    axios.get(`http://localhost:5001/api/courses/${id}`)
      .then(({ data }) => { setCourse(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [id, navigate]);

  // Shuffle answer bank ONCE whenever a new drag-drop quiz appears
  useEffect(() => {
    if (currentActiveQuiz?.activityType === 'drag-drop') {
      const rights = (currentActiveQuiz.matchPairs || []).map(p => p.right);
      setShuffledOptions([...rights].sort(() => Math.random() - 0.5));
    }
  }, [currentActiveQuiz]);

  const resetQuizStates = () => {
    setStudentAnswer('');
    setUserMatches({});
    setShuffledOptions([]);
    setFeedback(null);
  };

  const monitorPlaybackTimeline = () => {
    if (!videoRef.current || !course?.chapters[activeChapterIdx]) return;
    const currentSeconds = Math.floor(videoRef.current.currentTime);
    const activities = course.chapters[activeChapterIdx].activities || [];

    const pendingChallenge = activities.find(act =>
      Math.floor(act.timestamp) === currentSeconds && !clearedQuizIds.has(act._id)
    );

    if (pendingChallenge && currentActiveQuiz?._id !== pendingChallenge._id) {
      videoRef.current.pause();
      setCurrentActiveQuiz(pendingChallenge);
      resetQuizStates();
    }
  };

  const handleVideoEnded = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!userId || !course) return;
    markChapterComplete(userId, course._id, activeChapterIdx);
  };

  // Drop a right-side answer onto a left-side slot
  const handleDrop = (e, leftItem) => {
    e.preventDefault();
    const droppedRight = e.dataTransfer.getData('text/plain');
    setUserMatches(prev => ({ ...prev, [leftItem]: droppedRight }));
  };

  // Click a filled slot to clear it (send the answer back to the bank)
  const handleClearSlot = (leftItem) => {
    setUserMatches(prev => {
      const updated = { ...prev };
      delete updated[leftItem];
      return updated;
    });
  };

  const verifyActivitySolution = () => {
    if (!currentActiveQuiz) return;
    let isCorrect = false;

    if (currentActiveQuiz.activityType === 'fill-blanks') {
      isCorrect =
        studentAnswer.trim().toLowerCase() ===
        (currentActiveQuiz.correctAnswer || '').toString().trim().toLowerCase();
    } else if (currentActiveQuiz.activityType === 'drag-drop') {
      const pairs = currentActiveQuiz.matchPairs || [];
      isCorrect = pairs.length > 0 && pairs.every(
        pair => userMatches[pair.left]?.trim().toLowerCase() === pair.right?.trim().toLowerCase()
      );
    }

    if (isCorrect) {
      setFeedback('correct');
      setClearedQuizIds(prev => new Set([...prev, currentActiveQuiz._id]));
      setTimeout(() => {
        setCurrentActiveQuiz(null);
        resetQuizStates();
        videoRef.current?.play();
      }, 1500);
    } else {
      setFeedback('wrong');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading course...</div>;
  if (!course) return <div className="p-10 text-center">Course not found.</div>;

  const activeChapter = course.chapters[activeChapterIdx];
  const usedAnswers = new Set(Object.values(userMatches));
  const matchedCount = Object.keys(userMatches).length;
  const totalPairs = currentActiveQuiz?.matchPairs?.length || 0;

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Video player ── */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-4">{course.title}</h1>

          {course.chapters.length > 1 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {course.chapters.map((ch, idx) => (
                <button key={idx}
                  onClick={() => { setActiveChapterIdx(idx); setCurrentActiveQuiz(null); resetQuizStates(); }}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                    idx === activeChapterIdx
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                  }`}>
                  {ch.title || `Chapter ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <video
            ref={videoRef}
            controls
            src={activeChapter.videoUrl}
            onTimeUpdate={monitorPlaybackTimeline}
            onEnded={handleVideoEnded}
            className="w-full rounded-xl bg-black"
          />
        </div>

        {/* ── Activity sidebar ── */}
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          {currentActiveQuiz ? (
            <div className="space-y-4">

              {/* Badge */}
              <span className="inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {currentActiveQuiz.activityType === 'fill-blanks' ? 'Fill in the Blank' : 'Match the Following'}
              </span>

              {/* Question */}
              <h3 className="font-bold text-gray-900 text-sm">{currentActiveQuiz.question}</h3>

              {/* ── FILL IN THE BLANKS ── */}
              {currentActiveQuiz.activityType === 'fill-blanks' && (
                <div className="space-y-3">
                  {currentActiveQuiz.options?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentActiveQuiz.options.map((opt, i) => (
                        <span key={i} onClick={() => setStudentAnswer(opt)}
                          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100 transition-colors select-none">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="Type your answer here..."
                    value={studentAnswer}
                    onChange={e => setStudentAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && verifyActivitySolution()}
                  />
                </div>
              )}

              {/* ── MATCH THE FOLLOWING (Drag & Drop) ── */}
              {currentActiveQuiz.activityType === 'drag-drop' && (
                <div className="space-y-4">

                  {/* Answer bank — draggable chips */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">
                      Answer Bank — drag to match
                    </p>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl min-h-[48px]">
                      {shuffledOptions.map((opt, i) => {
                        const isUsed = usedAnswers.has(opt);
                        return (
                          <div key={i}
                            draggable={!isUsed}
                            onDragStart={e => !isUsed && e.dataTransfer.setData('text/plain', opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border select-none transition-all ${
                              isUsed
                                ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-default line-through'
                                : 'bg-blue-50 text-blue-800 border-blue-200 cursor-grab hover:bg-blue-100 hover:shadow-sm active:scale-95'
                            }`}>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                    <span>Match pairs below</span>
                    <span className={matchedCount === totalPairs ? 'text-green-500' : ''}>
                      {matchedCount}/{totalPairs} matched
                    </span>
                  </div>

                  {/* Left → Right match rows */}
                  <div className="space-y-2">
                    {(currentActiveQuiz.matchPairs || []).map((pair, i) => (
                      <div key={i} className="flex items-center gap-2">

                        {/* Left label */}
                        <div className="flex-1 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-xs font-semibold text-purple-900 text-center">
                          {pair.left}
                        </div>

                        <span className="text-gray-300 text-base shrink-0">→</span>

                        {/* Drop zone */}
                        <div
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => handleDrop(e, pair.left)}
                          onClick={() => userMatches[pair.left] && handleClearSlot(pair.left)}
                          title={userMatches[pair.left] ? 'Click to remove' : 'Drop an answer here'}
                          className={`flex-1 px-3 py-2 border-2 border-dashed rounded-lg text-xs font-semibold text-center min-h-[36px] flex items-center justify-center transition-all ${
                            userMatches[pair.left]
                              ? 'bg-green-50 border-green-400 text-green-800 cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-400'
                              : 'border-gray-200 text-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
                          }`}>
                          {userMatches[pair.left] || 'Drop here'}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button onClick={verifyActivitySolution}
                disabled={
                  currentActiveQuiz.activityType === 'drag-drop' && matchedCount < totalPairs
                }
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  currentActiveQuiz.activityType === 'drag-drop' && matchedCount < totalPairs
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}>
                {currentActiveQuiz.activityType === 'drag-drop' && matchedCount < totalPairs
                  ? `Match all ${totalPairs} pairs to submit`
                  : 'Submit Answer'}
              </button>

              {feedback === 'correct' && (
                <p className="text-sm font-bold text-green-600 text-center">✅ Correct! Resuming video…</p>
              )}
              {feedback === 'wrong' && (
                <p className="text-sm font-bold text-red-500 text-center">❌ Not quite — check your matches and try again.</p>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-10">
              <span className="text-3xl">🎬</span>
              <p className="text-gray-400 text-sm">Activities will appear here when the video reaches a milestone.</p>
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
};

export default StudentCourseView;