import React from 'react';
import { useNavigate } from 'react-router-dom';

function BackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/'); // Change this to the path you want to navigate to (e.g., home page)
  };

  return (
    <button onClick={handleBack} className="bg-gray-500 text-white px-4 py-2 rounded">
      Back
    </button>
  );
}

export default BackButton;
