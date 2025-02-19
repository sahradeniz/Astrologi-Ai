import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Group1 from "./assets/Group1.png";
import Group2 from "./assets/group2.png";
import Chart from "./assets/chart.png";
import Header from "./components/Header";
import InputForm from "./components/InputForm";
import Result from "./components/Results";
import CharacterPage from "./pages/CharacterPage";
import TransitPage from "./pages/TransitPage";
import SynastryPage from "./pages/SynastryPage";
import LifePurposePage from "./pages/LifePurposePage";
import "./App.css";

const App = () => {
  const [results, setResults] = useState(null);

  const handleSetResults = (data) => {
    console.log("API Response in App.js (before updating state):", data);
    setResults(data);
  };

  useEffect(() => {
    console.log("Updated Results State in App.js:", results);
  }, [results]);

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!results) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <div>
      <Router>
        <div className="App">
          <img src={Group1} alt="Background Decoration 1" className="group1" />
          <img src={Group2} alt="Background Decoration 2" className="group2" />
          <Header />
          <div className="content">
            <img src={Chart} alt="Astrology Chart" className="chart" />
            <Routes>
              <Route path="/" element={<InputForm setResult={handleSetResults} />} />
              <Route 
                path="/results" 
                element={
                  <ProtectedRoute>
                    <Result result={results} />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/character" 
                element={
                  <ProtectedRoute>
                    <CharacterPage />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/transit" 
                element={
                  <ProtectedRoute>
                    <TransitPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/synastry" element={<SynastryPage />} />
              <Route path="/life-purpose" element={<LifePurposePage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </div>
  );
};

export default App;
