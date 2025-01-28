import React from 'react';
import { useLocation } from 'react-router-dom';

const CharacterPage = () => {
  const { state } = useLocation();  // Retrieve the passed state (result) data
  const result = state ? state.result : null;

  return (
    <div>
      <h2>Karakter Özellikleri</h2>
      {result && (
        <>
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
        </>
      )}
    </div>
  );
};

export default CharacterPage;
