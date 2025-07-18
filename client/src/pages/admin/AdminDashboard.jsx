import React, { useState } from 'react';
import AddQuestion from '../../components/admin/AddQuestion';
import QuestionList from '../../components/admin/QuestionList';
import ScheduleTest from './ScheduleTest';
import ViewResults from './ViewResults';
import { FaPlusCircle, FaListUl, FaCalendarAlt, FaChartBar, FaUsersCog } from 'react-icons/fa';
import ManageStudents from './ManageStudents';

// Navigation Item Component for the sidebar
const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
    }`}
  >
    <span className="mr-3">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('addQuestion');

  const TABS = {
    manageStudents: { // ✨ NEW TAB
      label: 'Manage Students',
      icon: <FaUsersCog />,
      component: <ManageStudents />,
    },
    addQuestion: {
      label: 'Add Question',
      icon: <FaPlusCircle />,
      component: <AddQuestion />,
    },
    viewQuestions: {
      label: 'Question Bank',
      icon: <FaListUl />,
      component: <QuestionList />,
    },
    scheduleTest: {
      label: 'Schedule Test',
      icon: <FaCalendarAlt />,
      component: <ScheduleTest />,
    },
    viewResults: {
      label: 'View Results',
      icon: <FaChartBar />,
      component: <ViewResults />,
    },
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white p-4 md:p-6 shadow-lg md:min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4">Admin Menu</h2>
        <nav className="space-y-3">
          {Object.keys(TABS).map((tabKey) => (
            <NavItem
              key={tabKey}
              icon={TABS[tabKey].icon}
              label={TABS[tabKey].label}
              active={activeTab === tabKey}
              onClick={() => setActiveTab(tabKey)}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
           <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-100 pb-4">
            {TABS[activeTab].label}
          </h1>
          {TABS[activeTab].component}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
