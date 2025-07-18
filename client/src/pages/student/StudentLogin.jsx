import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { FaUserGraduate, FaSpinner } from 'react-icons/fa';
import Alert from '../../components/shared/Alert';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
        try {
            const { data } = await api.get('/public/colleges');
            setColleges(data);
        } catch (err) {
            setError('Could not load college list.');
        }
    };
    fetchColleges();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!collegeId) {
        setError('Please select your college.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password, college_id: collegeId });
      if (data.role !== 'student') {
        setError('Not a student account for the selected college.');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <FaUserGraduate className="mx-auto h-12 w-auto text-green-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Student Portal Login</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg">
          {error && <Alert message={error} type="error" />}
          <div className="rounded-md shadow-sm space-y-4">
              <div>
                  <label htmlFor="college" className="sr-only">College</label>
                  <select id="college" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} required className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-green-500 focus:border-green-500">
                      <option value="">-- Select Your College --</option>
                      {colleges.map(college => (
                          <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                  </select>
              </div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full px-3 py-3 border border-gray-300 rounded-md" placeholder="Email Address" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full px-3 py-3 border border-gray-300 rounded-md" placeholder="Password" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">
            {isLoading ? <FaSpinner className="animate-spin" /> : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm">
          Don't have an account?{' '}
          <Link to="/student/register" className="font-medium text-green-600 hover:text-green-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;