import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaCalendarAlt, FaPlay } from 'react-icons/fa';

const TestCard = ({ test }) => {
  const formattedDate = new Date(test.scheduled_at).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(test.scheduled_at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-200 p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-800">{test.title}</h3>
        <FaPlay className="text-green-500" title="Test Icon" />
      </div>

      <div className="text-sm text-gray-600 space-y-1 mb-4">
        <p className="flex items-center gap-2">
          <FaClock className="text-gray-400" />
          Duration: <span className="font-medium text-gray-700">{test.duration_minutes} minutes</span>
        </p>
        <p className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          Scheduled: <span className="font-medium text-gray-700">{formattedDate} at {formattedTime}</span>
        </p>
      </div>

      <Link
        to={`/student/test/${test.id}`}
        className="block text-center bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition"
      >
        Start Test
      </Link>
    </div>
  );
};

export default TestCard;
