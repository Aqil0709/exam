import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useProctoring from '../../hooks/useProctoring';
import CodeEditor from '../../components/shared/CodeEditor';
import { FaSpinner } from 'react-icons/fa';
import useAntiCheating from '../../hooks/useAntiCheating';

const TestScreen = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [studentTestId, setStudentTestId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTestReady, setIsTestReady] = useState(false);

  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [runCodeOutput, setRunCodeOutput] = useState(null);

  const handleViolation = useCallback((type) => {
    alert(`Violation detected: You have left ${type}. This is not allowed. The test will be submitted automatically.`);
    navigate('/student/dashboard');
  }, [navigate]);
  
  const handleDeviceFailure = useCallback((deviceName) => {
    alert(`${deviceName} has been turned off or disconnected. This is not allowed. The test will be submitted.`);
    navigate('/student/dashboard');
  }, [navigate]);

  const { requestPermissions, requestFullScreen } = useProctoring(handleViolation, handleDeviceFailure);
  useAntiCheating(isTestReady);
  const prepareTest = async () => {
    const permsGranted = await requestPermissions();
    if (!permsGranted) return;
    const fsGranted = await requestFullScreen();
    if (!fsGranted) return;
    setIsTestReady(true);
  };
  
  useEffect(() => {
    if (!isTestReady) return;
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get(`/student/test/${testId}`);
        setQuestions(data.questions);
        setStudentTestId(data.studentTestId);
        setIsLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test');
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [testId, isTestReady]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setRunCodeOutput(null);
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleRunCode = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const studentCode = answers[currentQuestion.id] || '';

    if (!studentCode) {
        alert("Please write some code before running.");
        return;
    }

    setIsCodeRunning(true);
    setRunCodeOutput(null);

    try {
        const { data } = await api.post('/exam/run', {
            language: currentQuestion.language,
            code: studentCode,
        });
        setRunCodeOutput(data);
    } catch (err) {
        setRunCodeOutput({ error: err.response?.data?.message || "An error occurred." });
    } finally {
        setIsCodeRunning(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;
    try {
        const formattedAnswers = Object.keys(answers).map(question_id => ({
            question_id: parseInt(question_id),
            answer_text: answers[question_id]
        }));
        const { data } = await api.post('/student/test/submit', {
            studentTestId,
            answers: formattedAnswers
        });
        alert(`Test submitted successfully! Your score: ${data.score}`);
        navigate('/student/dashboard');
    } catch (err) {
        alert('Failed to submit test. Please try again.');
        console.error(err);
    }
  };

  if (!isTestReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Test Environment Check</h1>
        <p className="mb-2">Camera, Microphone, and Fullscreen are mandatory.</p>
        <p className="text-sm text-gray-500 mb-6">Please grant permissions to begin.</p>
        <button onClick={prepareTest} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
          Start Secure Test
        </button>
      </div>
    );
  }

  if (isLoading) return <p>Loading test...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const currentQuestion = questions[currentQuestionIndex];
  const attemptedCount = Object.keys(answers).length;
  const remainingCount = questions.length - attemptedCount;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/4 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-bold text-lg mb-4">Test Status</h2>
        <p>Attempted: {attemptedCount}</p>
        <p>Remaining: {remainingCount}</p>
        <div className="mt-4">
            <h3 className="font-semibold">Questions:</h3>
            <ul className="list-decimal list-inside mt-2">
                {questions.map((q, index) => (
                    <li key={q.id} className={`cursor-pointer p-1 rounded ${index === currentQuestionIndex ? 'bg-blue-200' : ''} ${answers[q.id] ? 'text-green-600' : ''}`} onClick={() => setCurrentQuestionIndex(index)}>
                        Question {index + 1}
                    </li>
                ))}
            </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full lg:w-3/4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-bold text-xl mb-4">Question {currentQuestionIndex + 1} of {questions.length}</h3>
          
          {currentQuestion.type === 'mcq' && (
            <>
              <p className="mb-6 text-lg">{currentQuestion.question_text}</p>
              <div className="space-y-3">
                {JSON.parse(currentQuestion.options).map((option, index) => {
                  const optionKey = String.fromCharCode(65 + index); // 'A', 'B', 'C', 'D'
                  return (
                    <div key={index}>
                      <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          // ✨ FIX: The value is now the option key (e.g., "A") instead of the full text.
                          value={optionKey}
                          checked={answers[currentQuestion.id] === optionKey}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {currentQuestion.type === 'code' && (
            <div className="flex flex-col gap-4">
                <div>
                    <h4 className="font-semibold text-lg">Problem:</h4>
                    <p className="mb-4 mt-1">{currentQuestion.question_text}</p>
                    {currentQuestion.expected_output && (
                        <>
                            <h4 className="font-semibold">Expected Output:</h4>
                            <pre className="bg-gray-100 p-3 rounded-md font-mono text-sm mt-1">{currentQuestion.expected_output}</pre>
                        </>
                    )}
                </div>

                <div>
                    <h4 className="font-semibold">Your Solution:</h4>
                    <div className="mt-1">
                        <CodeEditor language={currentQuestion.language} value={answers[currentQuestion.id] || ''} onChange={(code) => handleAnswerChange(currentQuestion.id, code)}/>
                    </div>
                </div>

                <div className="flex justify-start">
                    <button onClick={handleRunCode} disabled={isCodeRunning} className="inline-flex items-center bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800">
                        {isCodeRunning && <FaSpinner className="animate-spin mr-2" />}
                        {isCodeRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>
                
                {runCodeOutput && (
                    <div>
                        <h4 className="font-semibold">Output:</h4>
                        <pre className={`bg-gray-900 text-white p-4 rounded-md font-mono text-sm mt-1 whitespace-pre-wrap ${runCodeOutput.error ? 'text-red-400' : ''}`}>
                            {runCodeOutput.error || runCodeOutput.output}
                        </pre>
                        {runCodeOutput.cpuTime && (
                             <div className="text-xs text-gray-400 mt-1">
                                CPU Time: {runCodeOutput.cpuTime}s | Memory: {runCodeOutput.memory}KB
                            </div>
                        )}
                    </div>
                )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            {currentQuestionIndex < questions.length - 1 ? (
              <button onClick={handleNext} className="bg-blue-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-600">
                Save & Next
              </button>
            ) : (
              <button onClick={handleSubmit} className="bg-green-600 text-white px-8 py-2 rounded-md font-bold hover:bg-green-700">
                Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestScreen;
