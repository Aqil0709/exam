import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Alert from '../../components/shared/Alert';
import { FaUserPlus, FaTrash, FaSpinner, FaPlus, FaUniversity } from 'react-icons/fa';

const MasterDashboard = () => {
    // State for managing admins
    const [admins, setAdmins] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminCollegeId, setAdminCollegeId] = useState(''); // State for selected college for new admin

    // State for managing colleges
    const [colleges, setColleges] = useState([]);
    const [newCollegeName, setNewCollegeName] = useState('');
    
    // General UI State
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [loading, setLoading] = useState(true);
    const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
    const [isSubmittingCollege, setIsSubmittingCollege] = useState(false);

    // Fetches both admins and colleges data when the component loads
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [adminsRes, collegesRes] = await Promise.all([
                api.get('/master/admins'),
                api.get('/public/colleges')
            ]);
            setAdmins(adminsRes.data);
            setColleges(collegesRes.data);
        } catch (error) {
            setMessage({ text: 'Failed to fetch dashboard data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Handler to create a new admin user
    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!adminCollegeId) {
            setMessage({ text: 'Please assign a college to the admin.', type: 'error' });
            return;
        }
        setIsSubmittingAdmin(true);
        try {
            // ✨ FIX: The college_id from the state is now correctly included in the API request payload.
            await api.post('/master/admins', { 
                name, 
                email, 
                password, 
                college_id: adminCollegeId 
            });
            setMessage({ text: 'Admin created successfully!', type: 'success' });
            setName('');
            setEmail('');
            setPassword('');
            setAdminCollegeId(''); // Reset the college dropdown
            fetchDashboardData(); // Refresh the entire dashboard data
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Failed to create admin.', type: 'error' });
        } finally {
            setIsSubmittingAdmin(false);
        }
    };

    // Handler to delete an admin user
    const handleDeleteAdmin = async (id) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                await api.delete(`/master/admins/${id}`);
                setMessage({ text: 'Admin deleted successfully.', type: 'success' });
                fetchDashboardData();
            } catch (error) {
                setMessage({ text: 'Failed to delete admin.', type: 'error' });
            }
        }
    };

    // Handler to create a new college
    const handleCreateCollege = async (e) => {
        e.preventDefault();
        setIsSubmittingCollege(true);
        try {
            await api.post('/master/colleges', { name: newCollegeName });
            setMessage({ text: 'College created successfully!', type: 'success' });
            setNewCollegeName('');
            fetchDashboardData();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Failed to create college.', type: 'error' });
        } finally {
            setIsSubmittingCollege(false);
        }
    };

    return (
        <div className="space-y-8">
            {message.text && <Alert message={message.text} type={message.type} />}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                <div className="lg:col-span-1 space-y-8">
                    {/* Create Admin Form */}
                    <form onSubmit={handleAddAdmin} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-2xl font-bold mb-4">Create New Admin</h2>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className="w-full p-2 border rounded" />
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email Address" required className="w-full p-2 border rounded" />
                        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full p-2 border rounded" />
                        <select value={adminCollegeId} onChange={e => setAdminCollegeId(e.target.value)} required className="w-full p-2 border rounded bg-white">
                            <option value="">-- Assign a College --</option>
                            {colleges.map(college => (
                                <option key={college.id} value={college.id}>{college.name}</option>
                            ))}
                        </select>
                        <button type="submit" disabled={isSubmittingAdmin} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center">
                            {isSubmittingAdmin ? <FaSpinner className="animate-spin" /> : <FaUserPlus className="mr-2" />}
                            {isSubmittingAdmin ? 'Creating...' : 'Create Admin'}
                        </button>
                    </form>

                    {/* Create College Form */}
                    <form onSubmit={handleCreateCollege} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                       <h2 className="text-2xl font-bold mb-4">Create New College</h2>
                        <input value={newCollegeName} onChange={e => setNewCollegeName(e.target.value)} placeholder="College Name" required className="w-full p-2 border rounded" />
                        <button type="submit" disabled={isSubmittingCollege} className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 flex items-center justify-center">
                            {isSubmittingCollege ? <FaSpinner className="animate-spin" /> : <FaPlus className="mr-2" />}
                            {isSubmittingCollege ? 'Creating...' : 'Create College'}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {/* Manage Admins List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Manage Admins</h2>
                        {loading ? <p>Loading...</p> : (
                            <ul className="divide-y divide-gray-200">
                                {admins.length > 0 ? admins.map(admin => (
                                    <li key={admin.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{admin.name}</p>
                                            <p className="text-sm text-gray-500">{admin.email}</p>
                                            <p className="text-sm text-blue-600 font-medium mt-1">{admin.college_name || 'No College Assigned'}</p>
                                        </div>
                                        <button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-500 hover:text-red-700">
                                            <FaTrash />
                                        </button>
                                    </li>
                                )) : <p>No admins created yet.</p>}
                            </ul>
                        )}
                    </div>

                    {/* Colleges List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Registered Colleges</h2>
                        {loading ? <p>Loading...</p> : (
                            <ul className="divide-y divide-gray-200">
                                {colleges.length > 0 ? colleges.map(college => (
                                    <li key={college.id} className="py-3 flex items-center">
                                        <FaUniversity className="mr-3 text-gray-400" />
                                        <p className="font-semibold">{college.name}</p>
                                    </li>
                                )) : <p>No colleges created yet.</p>}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterDashboard;
