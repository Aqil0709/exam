import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Alert from '../../components/shared/Alert';
import { FaCheck, FaTrash, FaSpinner } from 'react-icons/fa';

const ManageStudents = () => {
    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: 'info' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pendingRes, approvedRes] = await Promise.all([
                api.get('/admin/students/pending'),
                api.get('/admin/students/approved')
            ]);
            setPending(pendingRes.data);
            setApproved(approvedRes.data);
        } catch (error) {
            setMessage({ text: 'Failed to load student data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.put(`/admin/students/approve/${id}`);
            setMessage({ text: 'Student approved successfully!', type: 'success' });
            fetchData(); // Refresh lists
        } catch (error) {
            setMessage({ text: 'Failed to approve student.', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student? This will remove all their test data.')) {
            try {
                await api.delete(`/admin/students/${id}`);
                setMessage({ text: 'Student deleted successfully.', type: 'success' });
                fetchData(); // Refresh lists
            } catch (error) {
                setMessage({ text: 'Failed to delete student.', type: 'error' });
            }
        }
    };

    return (
        <div className="space-y-8">
            {message.text && <Alert message={message.text} type={message.type} />}
            
            {/* Pending Approvals Section */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-800 mb-4">Pending Approvals ({pending.length})</h3>
                {loading ? <FaSpinner className="animate-spin" /> : (
                    <ul className="divide-y divide-yellow-200">
                        {pending.length > 0 ? pending.map(student => (
                            <li key={student.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{student.name}</p>
                                    <p className="text-sm text-gray-600">{student.email}</p>
                                </div>
                                <button onClick={() => handleApprove(student.id)} className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 flex items-center">
                                    <FaCheck className="mr-2" /> Approve
                                </button>
                            </li>
                        )) : <p>No students are currently pending approval.</p>}
                    </ul>
                )}
            </div>

            {/* Approved Students Section */}
            <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Approved Students ({approved.length})</h3>
                {loading ? <FaSpinner className="animate-spin" /> : (
                     <ul className="divide-y divide-gray-200">
                        {approved.length > 0 ? approved.map(student => (
                            <li key={student.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{student.name}</p>
                                    <p className="text-sm text-gray-600">{student.email}</p>
                                </div>
                                <button onClick={() => handleDelete(student.id)} className="text-red-500 hover:text-red-700">
                                    <FaTrash />
                                </button>
                            </li>
                        )) : <p>No students have been approved yet.</p>}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ManageStudents;
