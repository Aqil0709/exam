import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { FaTrashAlt, FaSpinner, FaCode, FaListUl, FaSearch, FaEdit, FaTimes } from 'react-icons/fa';

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get('/admin/questions');
        setQuestions(data);
      } catch (error) {
        console.error('Failed to fetch questions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Filter questions based on search term
  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/admin/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      alert('Failed to delete the question.');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (question) => {
    setEditId(question.id);
    setEditText(question.question_text);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setEditText('');
  };

  const handleSave = async () => {
    try {
      await api.put(`/admin/questions/${editId}`, { question_text: editText });
      setQuestions(prev =>
        prev.map(q => (q.id === editId ? { ...q, question_text: editText } : q))
      );
      closeModal();
    } catch (error) {
      alert('Failed to update the question.');
    }
  };

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        closeModal();
      }
    };
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-600">
        <FaSpinner className="animate-spin mr-2" />
        Loading questions...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <FaListUl /> All Questions
      </h2>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border p-2 pl-10 rounded shadow-sm"
        />
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {filteredQuestions.length === 0 ? (
        <p className="text-gray-500">No questions match your search.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {filteredQuestions.map(q => (
            <li key={q.id} className="py-4 flex justify-between items-start">
              <div className="max-w-3xl">
                <p className="font-medium text-gray-900 truncate" title={q.question_text}>
                  {q.question_text}
                </p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  Type:
                  {q.type === 'code' ? (
                    <FaCode className="inline text-blue-500" />
                  ) : (
                    <FaListUl className="inline text-green-500" />
                  )}
                  <span className="uppercase ml-1">{q.type}</span>
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => openEditModal(q)}
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={deletingId === q.id}
                  className="text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  {deletingId === q.id ? (
                    <>
                      <FaSpinner className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrashAlt /> Delete
                    </>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Edit Question</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-gray-700 font-medium">Question Text</label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full border p-2 rounded bg-gray-50"
                rows={4}
              />
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionList;
