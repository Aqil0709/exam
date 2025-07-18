import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ViewResults = () => {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [results, setResults] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data } = await api.get('/admin/tests');
        setTests(data);
      } catch (error) {
        console.error('Failed to fetch tests:', error);
      } finally {
        setLoadingTests(false);
      }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    if (!selectedTestId) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        const { data } = await api.get(`/admin/results/${selectedTestId}`);
        setResults(data);
      } catch (error) {
        console.error(`Failed to fetch results for test ${selectedTestId}`, error);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, [selectedTestId]);

  const handleViewDetails = (studentId) => {
    navigate(`/admin/results/${selectedTestId}/student/${studentId}`);
  };

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">📊 View Test Results</h2>

      <div className="mb-5">
        <label htmlFor="test-select" className="block font-medium mb-1 text-gray-700">
          Select a Test
        </label>
        <select
          id="test-select"
          value={selectedTestId}
          onChange={e => setSelectedTestId(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Choose a test --</option>
          {tests.map(test => (
            <option key={test.id} value={test.id}>
              {test.title}
            </option>
          ))}
        </select>
      </div>

      {loadingResults ? (
        <p className="text-gray-500">⏳ Fetching results...</p>
      ) : results.length > 0 ? (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-xs text-gray-600 uppercase text-left">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Submitted At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {results.map(result => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{result.name}</td>
                  <td className="px-4 py-3 text-gray-600">{result.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-white text-xs ${
                        result.score >= 50 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {result.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(result.submitted_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetails(result.student_id)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedTestId ? (
        <p className="text-gray-600 mt-4">⚠️ No results found for this test yet.</p>
      ) : null}
    </div>
  );
};

export default ViewResults;
