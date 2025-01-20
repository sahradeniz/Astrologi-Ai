import React from "react";
import { useNavigate } from "react-router-dom"; // useNavigate Hook'unu ekliyoruz
import './Results.css';  // Custom styles for the result component

function Result({ result }) {
  const navigate = useNavigate();  // navigate fonksiyonunu çağırıyoruz

  // Handle Back Click
  const handleBack = () => {
    navigate('/');  // Geri gitmek için '/' ana sayfaya yönlendirme yapıyoruz
  };

  // Hata kontrolü: Eğer result nesnesi yoksa veya boşsa
  if (!result) {
    console.log("Result is empty or null.");
    return <p className="text-gray-500">No results available.</p>;
  }

  console.log("Backend Response in Result:", result);

  // Hata kontrolü: Eğer result bir hata içeriyorsa
  if (result.error) {
    return <p className="text-red-500">{result.error}</p>;
  }

  // Gezegenler, açılar ve evler için veri kontrolü
  const planets = result.gezegenler || {};
  const aspects = result.açılar || {};
  const houses = result.evler || [];

  // Eğer tüm veri boşsa kullanıcıya uyarı göster
  if (
    Object.keys(planets).length === 0 &&
    Object.keys(aspects).length === 0 &&
    houses.length === 0
  ) {
    console.log("No valid data returned from the backend.");
    return <p className="text-gray-500">No valid data available from the backend.</p>;
  }

  return (
    <div className="p-4">
      <h3 className="font-bold text-lg">Results:</h3>
      <div className="bg-gray-100 p-4 rounded">
        {/* Gezegenler */}
        <h4 className="font-bold">Planets:</h4>
        {Object.keys(planets).length > 0 ? (
          <ul>
            {Object.entries(planets).map(([planet, details]) => (
              <li key={planet}>
                {planet}: {details.burç}, {details.derece}°, {details.ev} house
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No planetary data available.</p>
        )}

        {/* Açıları */}
        <h4 className="font-bold mt-4">Aspects:</h4>
        {Object.keys(aspects).length > 0 ? (
          <ul>
            {Object.entries(aspects).map(([aspect, value]) => (
              <li key={aspect}>
                {aspect}: {value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No aspects data available.</p>
        )}

        {/* Evler */}
        <h4 className="font-bold mt-4">Houses:</h4>
        {houses.length > 0 ? (
          <ul>
            {houses.map((house, index) => (
              <li key={index}>
                House {index + 1}: {house.burç}, {house.derece}°
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No houses data available.</p>
        )}

        {/* Timezone */}
        <h4 className="font-bold mt-4">Timezone:</h4>
        <p>{result.timezone || "Timezone not available."}</p>

        {/* Back button */}
        <button onClick={handleBack} className="bg-gray-500 text-white px-4 py-2 rounded mt-4">
          Back
        </button>
      </div>
    </div>
  );
}

export default Result;
