import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TransitPage = () => {
  const { state } = useLocation();  // Retrieve the passed state (result) data
  const result = state ? state.result : null;
  const [transitData, setTransitData] = useState(null);

  const fetchTransitData = async () => {
    // Add your logic to fetch transit data here
  };

  useEffect(() => {
    fetchTransitData(); // Fetch transit data
  }, []);

  return (
    <div>
      <h2>Günlük Transitler</h2>
      {result && (
        <p>Your birth chart: {result.birth_date}</p>  // Example to display data
      )}
      {/* Transit data logic will go here */}
    </div>
  );
};

export default TransitPage;
