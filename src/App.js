import React, { useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Results from './components/Results';

const App = () => {
  const [results, setResults] = useState(null);

  // Backend'den dönen sonucu kontrol etmek için konsola yazdırma
  const handleSetResults = (data) => {
    console.log("Backend Response:", data);
    setResults(data); // Results state'ini güncelle
  };

  return (
    <div className="App">
      <Header />
      {results ? (
        <Results results={results} />
      ) : (
        <InputForm setResult={handleSetResults} />
      )}
    </div>
  );
};

export default App;
