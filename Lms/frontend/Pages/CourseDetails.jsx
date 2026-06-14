import  { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [course, setCourse] = useState(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5001/api/courses/${id}`);
      setCourse(data);
    } catch (err) {
      console.error("Error fetching course:", err);
    }
  };

  const monitorPlayback = (time) => {
    const chapter = course?.chapters[activeChapterIdx];
    if (!chapter?.activities) return;

    // Buffer of 1 second to trigger the activity
    const found = chapter.activities.find(act => Math.abs(act.timestamp - time) < 1);

    if (found && currentActivity?._id !== found._id) {
      if (videoRef.current) videoRef.current.pause();
      setCurrentActivity(found);
      setUserAnswers({}); // Reset answers
    }
  };

  const resumePlayback = () => {
    setCurrentActivity(null);
    if (videoRef.current) videoRef.current.play();
  };

  if (!course) return <div className="p-10">Loading...</div>;
  const activeChapter = course.chapters[activeChapterIdx];

  return (
    <StudentLayout>
      <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* VIDEO SECTION */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-4">{course.title}</h1>
          <video 
            ref={videoRef}
            controls 
            className="w-full rounded-xl bg-black"
            onTimeUpdate={(e) => monitorPlayback(e.target.currentTime)}
          >
            <source src={activeChapter.videoUrl} type="video/mp4" />
          </video>
        </div>

        {/* ACTIVITY SIDEBAR */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border shadow-sm">
          {currentActivity ? (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">{currentActivity.question}</h3>

              {currentActivity.activityType === 'fill-blanks' ? (
                <input 
                  className="w-full border p-3 rounded-lg"
                  placeholder="Type your answer here..."
                  onChange={(e) => setUserAnswers({ text: e.target.value })}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {/* Left: Options */}
                    <div className="w-1/2 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Options</p>
                      {currentActivity.matchPairs.map((pair, i) => (
                        <div 
                          key={i} draggable 
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", pair.right)}
                          className="p-3 bg-blue-50 border rounded cursor-grab text-sm"
                        >
                          {pair.right}
                        </div>
                      ))}
                    </div>
                    {/* Right: Targets */}
                    <div className="w-1/2 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Match To</p>
                      {currentActivity.matchPairs.map((pair, i) => (
                        <div 
                          key={i}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const data = e.dataTransfer.getData("text/plain");
                            setUserAnswers(prev => ({ ...prev, [pair.left]: data }));
                          }}
                          className={`p-3 border-2 border-dashed rounded text-sm ${
                            userAnswers[pair.left] ? 'bg-green-50 border-green-300' : 'border-gray-200'
                          }`}
                        >
                          {userAnswers[pair.left] || pair.left}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={resumePlayback} 
                className="w-full bg-black text-white py-3 rounded-lg font-bold mt-4"
              >
                Submit & Continue
              </button>
            </div>
          ) : (
            <p className="text-gray-400 italic">Video progress will trigger activities here.</p>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default CourseDetails;