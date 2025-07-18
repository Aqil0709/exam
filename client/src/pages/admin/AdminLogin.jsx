import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { FaUserShield, FaSpinner } from 'react-icons/fa';
import Alert from '../../components/shared/Alert';

const AdminLogin = () => {
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
        setError('Please select a college.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password, college_id: collegeId });
      if (data.role !== 'admin') {
        setError('Access Denied: This is not a valid admin account for the selected college.');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed! Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center items-center">
            <FaUserShield className="text-blue-600" size={48} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal Login
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="college" className="sr-only">College</label>
              <select id="college" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} required className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="">-- Select College --</option>
                  {colleges.map(college => (
                      <option key={college.id} value={college.id}>{college.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full px-3 py-3 border border-gray-300 rounded-md" placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full px-3 py-3 border border-gray-300 rounded-md" placeholder="Password" />
            </div>
          </div>

          {error && <Alert message={error} type="error" />}

          <div>
            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
              {isLoading ? <FaSpinner className="animate-spin" /> : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;