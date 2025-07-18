import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const StudentResultDetail = () => {
    const { testId, studentId } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const { data } = await api.get(`/admin/results/${testId}/student/${studentId}`);
                setDetails(data);
            } catch (err) {
                setError('❌ Failed to load student test details. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [testId, studentId]);

    if (loading) return <p className="text-center text-gray-600">Loading test analysis...</p>;
    if (error) return <p className="text-center text-red-600">{error}</p>;
    if (!details) return <p className="text-center text-gray-500">No details found for this test submission.</p>;

    const { studentInfo, testInfo, answers } = details;

    return (
        <div className="bg-white p-6 md:p-10 rounded-lg shadow-lg max-w-5xl mx-auto mt-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Test Analysis</h1>

            <div className="mb-8 space-y-2 text-gray-700">
                <p><strong>👤 Student:</strong> {studentInfo.name} ({studentInfo.email})</p>
                <p><strong>📝 Test:</strong> {testInfo.title}</p>
                <p><strong>📊 Final Score:</strong> {studentInfo.score} / {answers.length}</p>
            </div>

            <div className="space-y-8">
                {answers.map((item, index) => (
                    <div key={item.question_id} className="border border-gray-200 p-6 rounded-md shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">Question {index + 1}</h3>
                            <div className={`flex items-center font-bold ${item.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                {item.is_correct ? (
                                    <>
                                        <FaCheckCircle className="mr-2" /> Correct
                                    </>
                                ) : (
                                    <>
                                        <FaTimesCircle className="mr-2" /> Incorrect
                                    </>
                                )}
                            </div>
                        </div>

                        <p className="bg-gray-50 p-4 rounded text-gray-700 whitespace-pre-wrap">
                            {item.question_text}
                        </p>

                        <div className="mt-4">
                            <h4 className="font-medium text-gray-800">Student's Answer:</h4>
                            {item.type === 'code' ? (
                                <pre className="bg-gray-800 text-white p-3 rounded-md font-mono text-sm mt-1 overflow-auto">
                                    {item.answer_text || '(No answer submitted)'}
                                </pre>
                            ) : (
                                <p className="bg-gray-100 p-3 rounded mt-1 text-gray-700">
                                    {item.answer_text || '(No answer submitted)'}
                                </p>
                            )}
                        </div>

                        {!item.is_correct && (
                            <div className="mt-4">
                                <h4 className="font-medium text-green-700">Correct Answer:</h4>
                                {item.type === 'code' ? (
                                    <pre className="bg-green-50 text-green-900 p-3 rounded-md font-mono text-sm mt-1 overflow-auto">
                                        {item.solution || item.correct_option}
                                    </pre>
                                ) : (
                                    <p className="bg-green-50 text-green-900 p-3 rounded mt-1">
                                        {item.options?.[item.correct_option?.charCodeAt(0) - 65]}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-10 text-center">
                <Link
                    to="/admin/dashboard"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition duration-200"
                >
                    &larr; Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default StudentResultDetail;
