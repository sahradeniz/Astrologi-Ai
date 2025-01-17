import React from "react";

function Results({ result }) {
  if (!result) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold">Results:</h3>
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-bold">Planets:</h4>
        <ul>
          {result.gezegenler &&
            Object.entries(result.gezegenler).map(([planet, details]) => (
              <li key={planet}>
                {planet}: {details.burç}, {details.ev}. house
              </li>
            ))}
        </ul>
        <h4 className="font-bold">Aspects:</h4>
        <ul>
          {result.açılar &&
            Object.entries(result.açılar).map(([aspect, value]) => (
              <li key={aspect}>
                {aspect}: {value}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default Results;

