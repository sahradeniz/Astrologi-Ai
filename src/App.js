import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Group1 from "./assets/Group1.png";
import Group2 from "./assets/group2.png";
import Chart from "./assets/chart.png";
import Header from "./components/Header";
import InputForm from "./components/InputForm";
import CharacterPage from "./pages/CharacterPage";
import TransitPage from "./pages/TransitPage";
import SynastryPage from "./pages/SynastryPage";
import LifePurposePage from "./pages/LifePurposePage";
import "./App.css";

const App = () => {
  const [results, setResults] = useState(() => {
    // Try to load initial state from localStorage
    const stored = localStorage.getItem('natalChart');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored natal chart:', e);
        return null;
      }
    }
    return null;
  });

  const handleSetResults = (data) => {
    console.log("Setting results in App.js:", data);
    setResults(data);
  };

  useEffect(() => {
    console.log("Updated Results State in App.js:", results);
  }, [results]);

  return (
    <Router>
      <div className="App">
        <img src={Group1} alt="Background Decoration 1" className="group1" />
        <img src={Group2} alt="Background Decoration 2" className="group2" />
        <Header />
        <div className="content">
          <img src={Chart} alt="Astrology Chart" className="chart" />
          <Routes>
            <Route 
              path="/" 
              element={<InputForm setResult={handleSetResults} />} 
            />
            <Route 
              path="/character" 
              element={
                results ? (
                  <CharacterPage initialData={results} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/transit" 
              element={
                results ? (
                  <TransitPage initialData={results} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route path="/synastry" element={<SynastryPage />} />
            <Route path="/life-purpose" element={<LifePurposePage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
