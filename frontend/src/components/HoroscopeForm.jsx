import { useState } from 'react';
import PropTypes from 'prop-types';

import { apiClient } from '../lib/api.js';

function HoroscopeForm({ onLoadingChange, onResult, onError }) {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    onLoadingChange(true);
    onError(null);

    try {
      const response = await apiClient.post('/api/horoscope', {
        name,
        birthdate: birthdate || null
      });

      onResult(response.data);
    } catch (err) {
      const message =
        err.response?.data?.error || 'İstek sırasında bir hata oluştu. Tekrar dene!';
      onError(message);
      onResult(null);
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">
        İsim
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Adını gir"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label htmlFor="birthdate">
        Doğum Tarihi
        <input
          id="birthdate"
          name="birthdate"
          type="date"
          value={birthdate}
          onChange={(event) => setBirthdate(event.target.value)}
        />
      </label>

      <button type="submit" disabled={!name.trim()}>
        Yıldızlara Sor
      </button>
    </form>
  );
}

HoroscopeForm.propTypes = {
  onLoadingChange: PropTypes.func.isRequired,
  onResult: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};

export default HoroscopeForm;
