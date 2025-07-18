import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Alert from '../../components/shared/Alert';
import { FaClock, FaListUl, FaCheckCircle } from 'react-icons/fa';

const ScheduleTest = () => {
  const [title, setTitle] = useState('');
  const [duration_minutes, setDuration] = useState(60);
  const [scheduled_at, setScheduledAt] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get('/admin/questions');
        setAllQuestions(data);
      } catch (error) {
        setMessage({ text: '❌ Failed to load questions.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleQuestionToggle = (id) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return setMessage({ text: 'Please provide a test title.', type: 'error' });
    }

    if (selectedQuestions.length === 0) {
      return setMessage({ text: 'Please select at least one question.', type: 'error' });
    }

    if (!scheduled_at || new Date(scheduled_at) < new Date()) {
      return setMessage({ text: 'Please choose a valid future time.', type: 'error' });
    }

    try {
      await api.post('/admin/tests', {
        title,
        duration_minutes,
        scheduled_at,
        question_ids: selectedQuestions,
        // student_ids: [] (future support)
      });
      setMessage({ text: '✅ Test scheduled successfully!', type: 'success' });
      setTitle('');
      setDuration(60);
      setScheduledAt('');
      setSelectedQuestions([]);
    } catch (error) {
      setMessage({ text: '❌ Failed to schedule test.', type: 'error' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        <FaClock /> Schedule a New Test
      </h2>

      {message.text && (
        <Alert message={message.text} type={message.type} />
      )}

      {loading ? (
        <p className="text-gray-500">Loading questions...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Test Title */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Test Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="e.g., Midterm Coding Assessment"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={duration_minutes}
              onChange={e => setDuration(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>

          {/* Scheduled At */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Scheduled At</label>
            <input
              type="datetime-local"
              value={scheduled_at}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Questions Selection */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FaListUl /> Select Questions
              <span className="text-sm text-gray-500 ml-2">({selectedQuestions.length} selected)</span>
            </h3>

            {allQuestions.length === 0 ? (
              <p className="text-gray-500">No questions available.</p>
            ) : (
              <div className="border rounded p-2 h-64 overflow-y-auto space-y-2">
                {allQuestions.map(q => (
                  <label
                    key={q.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(q.id)}
                      onChange={() => handleQuestionToggle(q.id)}
                      className="form-checkbox h-5 w-5 text-blue-500"
                    />
                    <span className="truncate" title={q.question_text}>
                      {q.question_text}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded shadow"
          >
            <FaCheckCircle className="inline mr-2" /> Schedule Test
          </button>
        </form>
      )}
    </div>
  );
};

export default ScheduleTest;
