import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Group1 from './assets/Group1.png';
import Group2 from './assets/group2.png';
import Chart from './assets/chart.png';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Result from './components/Results';
import './App.css';

const App = () => {
  const [results, setResults] = useState(null);

  const handleSetResults = (data) => {
    console.log("API Response in App.js (before updating state):", data);
    setResults(data); 
  };

  useEffect(() => {
    console.log("Updated Results State in App.js:", results);
  }, [results]);

  return (
    <Router>
      <div className="App">
        <img src={Group1} alt="Group1" className="group1" />
        <img src={Group2} alt="Group2" className="group2" />
        
        <Header />
        <div className="content">
          <img src={Chart} alt="Chart" className="chart" />

          <Routes>
            <Route path="/" element={<InputForm setResult={handleSetResults} />} />
            <Route path="/results" element={<Result result={results} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
