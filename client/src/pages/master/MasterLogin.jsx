import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FaUserTie, FaSpinner } from 'react-icons/fa';
import Alert from '../../components/shared/Alert';

const MasterLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.role !== 'master') {
        setError('Access Denied: This is not a valid master account.');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      navigate('/master/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <FaUserTie className="mx-auto h-12 w-auto text-purple-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Master Panel Login</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg">
          {error && <Alert message={error} type="error" />}
          <div className="rounded-md shadow-sm space-y-4">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full px-3 py-3 border border-gray-300 rounded-md" placeholder="Email address" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full px-3 py-3 border border-gray-300 rounded-md" placeholder="Password" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400">
            {isLoading ? <FaSpinner className="animate-spin" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MasterLogin;
