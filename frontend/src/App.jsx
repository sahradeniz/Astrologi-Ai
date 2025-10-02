import { useState } from 'react';
import HoroscopeForm from './components/HoroscopeForm.jsx';
import HoroscopeResult from './components/HoroscopeResult.jsx';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  return (
    <main>
      <h1>Astrologi-AI</h1>
      <p className="subtitle">
        Kişisel bilgilerini gir, yıldızların bugün senin için ne söylediğini keşfet.
      </p>

      <HoroscopeForm
        onLoadingChange={setLoading}
        onResult={setResult}
        onError={setError}
      />

      <HoroscopeResult loading={loading} result={result} error={error} />

      <footer>© {new Date().getFullYear()} Astrologi-AI. Kozmos seninle olsun.</footer>
    </main>
  );
}

export default App;
