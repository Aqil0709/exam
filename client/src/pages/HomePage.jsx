import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserShield, FaUserGraduate, FaClipboardList, FaLaptopCode, FaChartLine, FaUserTie } from 'react-icons/fa';

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center">
    <div className="flex justify-center items-center mb-4 text-blue-500">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const HomePage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-20 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <h1 className="text-5xl font-extrabold mb-4">Welcome to the Implisoft Secure Exam Platform</h1>
        <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
          A reliable, secure, and intuitive platform for conducting online examinations with automated proctoring and instant results.
        </p>
        <div className="flex justify-center gap-6">
          
          <Link
            to="/admin/login"
            className="group flex flex-col items-center justify-center w-56 p-6 bg-white text-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <FaUserShield size={48} className="mb-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
            <h2 className="text-2xl font-bold mb-1">Admin Portal</h2>
            <p className="text-sm text-gray-500">Manage questions, schedule tests, and view results.</p>
          </Link>
          <Link
            to="/student/login"
            className="group flex flex-col items-center justify-center w-56 p-6 bg-white text-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <FaUserGraduate size={48} className="mb-4 text-green-500 group-hover:text-green-600 transition-colors" />
            <h2 className="text-2xl font-bold mb-1">Student Portal</h2>
            <p className="text-sm text-gray-500">Take scheduled tests and view your scores.</p>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FaClipboardList size={40} />}
              title="Diverse Question Types"
              description="Create exams with multiple-choice and complex coding questions to thoroughly assess knowledge."
            />
            <FeatureCard 
              icon={<FaLaptopCode size={40} />}
              title="Secure Proctoring"
              description="Ensure test integrity with mandatory fullscreen, camera, and microphone monitoring."
            />
            <FeatureCard 
              icon={<FaChartLine size={40} />}
              title="Instant Results & Analysis"
              description="Students get immediate feedback, and admins can perform detailed answer analysis."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center p-4">
        <p>&copy; 2025 Implisoft Secure Exam Platform. All Rights Reserved.<br>
        </br>Developed By @Implisoft</p>
      </footer>
    </div>
  );
};

export default HomePage;
