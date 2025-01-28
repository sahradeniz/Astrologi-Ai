import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

function Result({ result, calculateTransit }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1); // Default active tab
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [transitData, setTransitData] = useState(null); // Transit data

  const fetchTransitData = async () => {
    setIsLoading(true); // Start loading
    try {
      const response = await fetch("https://astrolog-ai.onrender.com/transit-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date: result.birth_date,
          location: result.location,
        }),
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("API error: Response not ok.");
      }

      const transitResult = await response.json();
      setTransitData(transitResult); // Store transit data
    } catch (error) {
      console.error("Error fetching transit data:", error);
      setTransitData({ error: "Transit data could not be fetched." });
    } finally {
      setIsLoading(false); // End loading
    }
  };

  useEffect(() => {
    if (activeTab === 2) {
      fetchTransitData(); // Fetch transit data when "Günlük Transitler" tab is clicked
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <div className="tab-content">
            <h4>Karakter Özellikleri</h4>
            {Object.entries(result.gezegenler).map(([planet, details]) => (
              <p key={planet}>
                {planet}: {details.burç}, {details.derece}°, {details.ev} evinde
              </p>
            ))}
            {result.evler.map((house, index) => (
              <p key={index}>
                House {index + 1}: {house.burç}, {house.derece}°
              </p>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="tab-content">
            <h4>Günlük Transitler</h4>
            {isLoading ? (
              <p>Transit data is loading...</p>
            ) : (
              transitData ? (
                transitData.error ? (
                  <p>{transitData.error}</p>
                ) : (
                  Object.entries(transitData.transit_positions).map(([planet, position]) => (
                    <p key={planet}>
                      <span className="highlight">{planet}</span>: {position}° - {transitData.transit_comments[planet]}
                    </p>
                  ))
                )
              ) : (
                <p>No transit data available yet.</p>
              )
            )}
          </div>
        );
      case 3:
        return (
          <div className="tab-content">
            <h4>Your Vibe</h4>
            <p>Your vibe is calm and centered today.</p>
          </div>
        );
      case 4:
        return (
          <div className="tab-content">
            <h4>Life Path</h4>
            <p>Your life path is about exploring new opportunities and embracing change.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <StyledWrapper>
      <div className="result-container">
        <h3 className="result-title">Results:</h3>
        <div className="tabs">
          <button
            onClick={() => setActiveTab(1)}
            className={activeTab === 1 ? "active" : ""}
          >
            Karakter Özellikleri
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={activeTab === 2 ? "active" : ""}
          >
            Günlük Transitler
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={activeTab === 3 ? "active" : ""}
          >
            Your Vibe
          </button>
          <button
            onClick={() => setActiveTab(4)}
            className={activeTab === 4 ? "active" : ""}
          >
            Life Path
          </button>
        </div>
        {renderContent()}
        <button
          onClick={() => navigate('/')}
          className="back-btn"
        >
          Geri
        </button>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .result-container {
    background-color: #222; /* Dark background for contrast */
    padding: 20px;
    box-shadow: 0px 2px 15px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }

  .result-title {
    font-family: 'Instrument Serif', serif;
    font-size: 28px;
    margin-bottom: 20px;
    text-align: center;
    color: #fff;
  }

  .tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
    border-bottom: 2px solid #ddd;
  }

  button {
    background: linear-gradient(135deg, #ff7d00, #ff6c96, #ffbd3e);
    color: white;
    padding: 15px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    text-align: center;
    border-radius: 15px;
    transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
    margin: 5px;
  }

  button.active {
    background-color: #ff6c96;
    font-weight: bold;
    transform: scale(1.05);
  }

  button:hover {
    transform: scale(1.05);
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2);
  }

  .tab-content {
    padding: 20px;
    background-color: white;
    border-radius: 5px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  }

  .highlight {
    font-weight: bold;
  }

  .back-btn {
    background-color: #ff7d00;
    color: white;
    padding: 10px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    border-radius: 5px;
    margin-top: 20px;
  }
`;

export default Result;
