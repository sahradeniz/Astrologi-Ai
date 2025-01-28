import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Results.css';  // Custom styles for the result component

function Result({ result }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1); // Başlangıçta 1. tab aktif olacak
  const [transitData, setTransitData] = useState(null); // Transit verisini saklamak için state
  const [isLoading, setIsLoading] = useState(false); // Yükleniyor durumu

  // Handle Back Click
  const handleBack = () => {
    navigate('/'); // Geri gitmek için '/' ana sayfaya yönlendirme yapıyoruz
  };

  // Transit verisini almak için fonksiyon
  const fetchTransitData = async () => {
    try {
      setIsLoading(true); // Yükleniyor durumunu başlat
      const response = await fetch('https://astrolog-ai.onrender.com/transit-chart', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date: result.birth_date,
          location: result.location
        }),
        mode: "cors"
      });

      if (!response.ok) {
        throw new Error("API error: Response not ok.");
      }

      const transitResult = await response.json();
      setTransitData(transitResult); // Transit verisini state'e set et
    } catch (error) {
      console.error("Error fetching transit data:", error);
      setTransitData({ error: "Transit verisi alınırken bir hata oluştu." });
    } finally {
      setIsLoading(false); // Yükleniyor durumu sonlanır
    }
  };

  // Kutu içeriği render fonksiyonu
  const renderContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <div>
            <h4>Karakter Özellikleri</h4>
            {/* Gezegenler ve evler bilgisi */}
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
          <div>
            <h4>Günlük Transitler</h4>
            {isLoading ? (
              <p>Transit verisi yükleniyor...</p> // Yükleniyor mesajı
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
                <p>Transit verisi henüz yüklenmedi.</p>
              )
            )}
          </div>
        );
      case 3:
        return (
          <div>
            <h4>Your Vibe</h4>
            <p>Your vibe is calm and centered today.</p>
          </div>
        );
      case 4:
        return (
          <div>
            <h4>Life Path</h4>
            <p>Your life path is about exploring new opportunities and embracing change.</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Transit tabına tıklanırsa veriyi almak
  useEffect(() => {
    if (activeTab === 2) {
      fetchTransitData(); // Transit verisini al
    }
  }, [activeTab]); // activeTab değiştiğinde çalışacak

  return (
    <div className="p-4">
      <h3 className="font-bold text-lg">Sonuçlar:</h3>
      <div className="bg-gray-100 p-4 rounded">
        <div className="tabs">
          <button onClick={() => setActiveTab(1)} className={activeTab === 1 ? "active" : ""}>
            Karakter Özellikleri
          </button>
          <button onClick={() => setActiveTab(2)} className={activeTab === 2 ? "active" : ""}>
            Günlük Transitler
          </button>
          <button onClick={() => setActiveTab(3)} className={activeTab === 3 ? "active" : ""}>
            Your Vibe
          </button>
          <button onClick={() => setActiveTab(4)} className={activeTab === 4 ? "active" : ""}>
            Life Path
          </button>
        </div>
        <div className="tab-content">
          {renderContent()}
        </div>
        {/* Geri butonu */}
        <button onClick={handleBack} className="bg-gray-500 text-white px-4 py-2 rounded mt-4 transition-all duration-300 transform hover:scale-105">
          Geri
        </button>
      </div>
    </div>
  );
}

export default Result;
