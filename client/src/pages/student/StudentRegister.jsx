import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Alert from '../../components/shared/Alert';
import { FaUserGraduate, FaSpinner } from 'react-icons/fa';

const StudentRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setMessage({ text: data.message, type: 'success' });
      setIsSuccess(true); // Hide the form and show the success message
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Registration failed!', type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <FaUserGraduate className="mx-auto h-12 w-auto text-green-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create Your Student Account</h2>
        </div>
        
        {/* Show a success message after successful registration */}
        {isSuccess ? (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <Alert message={message.text} type={message.type} />
                <p className="mt-4 text-gray-600">You will be able to log in once an administrator has approved your account.</p>
                <Link to="/" className="mt-6 inline-block font-medium text-green-600 hover:text-green-500">
                    &larr; Back to Home
                </Link>
            </div>
        ) : (
            // Show the registration form initially
            <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg">
              {message.text && !isSuccess && <Alert message={message.text} type={message.type} />}
              
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label htmlFor="full-name" className="sr-only">Full Name</label>
                  <input
                    id="full-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label htmlFor="email-address" className="sr-only">Email address</label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin h-5 w-5 mr-3" />
                      Registering...
                    </>
                  ) : (
                    'Register for Approval'
                  )}
                </button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default StudentRegister;
