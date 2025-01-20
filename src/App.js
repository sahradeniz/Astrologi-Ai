import React, { useState, useEffect } from 'react'; // React ve useState'i ekliyoruz
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // React Router importları
import Group1 from './assets/Group1.png'; // Görselleri import et
import Group2 from './assets/group2.png'; // Görselleri import et
import Chart from './assets/chart.png'; // Görselleri import et
import Header from './components/Header';
import InputForm from './components/InputForm';
import Result from './components/Results'; // Sonuçları gösterecek bileşen
import './App.css'; // Custom styles

const App = () => {
  const [results, setResults] = useState(null); // Sonuçları tutacak state

  // Backend'den dönen sonucu kontrol etmek için konsola yazdırma
  const handleSetResults = (data) => {
    console.log("API Response in App.js (before updating state):", data);
    setResults(data); // Sonucu state'e kaydediyoruz
  };

  // State'in güncellenip güncellenmediğini kontrol etmek için
  useEffect(() => {
    console.log("Updated Results State in App.js:", results);
  }, [results]);

  return (
    <Router>  {/* Sayfalar arası geçişi sağlayacak Router */}
      <div className="App">
        {/* Sol üstte Group1 */}
        <img src={Group1} alt="Group1" className="group1" />
        {/* Sağ üstte Group2 */}
        <img src={Group2} alt="Group2" className="group2" />
        
        <Header />
        <div className="content">
          {/* Chart görselini sayfaya ekliyoruz */}
          <img src={Chart} alt="Chart" className="chart" />

          <Routes>
            {/* Ana sayfa, InputForm bileşenini render ediyor */}
            <Route path="/" element={<InputForm setResult={handleSetResults} />} /> 
            {/* Sonuçları gösterecek sayfa */}
            <Route path="/results" element={<Result result={results} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
