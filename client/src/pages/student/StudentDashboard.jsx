import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import TestCard from '../../components/student/TestCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/student/dashboard');
        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Unable to load dashboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const filteredTests = dashboardData?.scheduledTests?.filter(test =>
    test.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-10 text-gray-500">🔄 Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Greeting */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{dashboardData?.greeting || 'Welcome back!'}</h1>

      {/* Scheduled Tests */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <h2 className="text-2xl font-semibold text-gray-700">📝 Scheduled Tests</h2>
          <input
            type="text"
            placeholder="Search test by title..."
            className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredTests?.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map(test => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No matching tests found.</div>
        )}
      </section>

      {/* Past Scores */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">📊 Your Test Performance</h2>

        {dashboardData?.pastScores?.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">📈 Score Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboardData.pastScores}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">🧾 Score Breakdown</h3>
              <ul className="divide-y divide-gray-200">
                {dashboardData.pastScores.map((result, index) => (
                  <li key={index} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{result.title}</p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                    <span className="text-blue-600 font-semibold">Score: {result.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">You have not attempted any tests yet.</p>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
