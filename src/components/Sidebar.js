import React from 'react';

export default function Sidebar() {
  return (
    <aside className="bg-gray-100 w-64 p-4">
      <ul>
        <li className="py-2"><a href="/">Kişisel Harita</a></li>
        <li className="py-2"><a href="/sinastri">Sinastri Haritası</a></li>
      </ul>
    </aside>
  );
}

