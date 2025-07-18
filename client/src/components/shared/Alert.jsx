import React from 'react';

const Alert = ({ message, type }) => {
  if (!message) return null;

  const baseClasses = 'p-4 mb-4 text-sm rounded-lg';
  const typeClasses = {
    error: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`} role="alert">
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default Alert;