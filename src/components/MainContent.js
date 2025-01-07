import { useState } from "react";

export default function MainContent() {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });

  const [result, setResult] = useState(null); // Backend'den gelen sonucu saklamak için state

  const handleNatalSubmit = async () => {
    try {
      const response = await fetch("https://astrolog-ai.onrender.com/natal-chart", { // Render URL'ini ekledik
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date: `${formData.birthDate} ${formData.birthTime}`,
          location: formData.birthPlace,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend'den yanıt alınamadı.");
      }

      const result = await response.json();
      setResult(result); // Sonucu ekrana göstermek için state'e kaydet
    } catch (error) {
      console.error("Error fetching natal chart:", error);
      setResult({ error: "Hata oluştu, lütfen tekrar deneyin." });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData); // Form verilerini kontrol etmek için
    await handleNatalSubmit(); // Backend ile iletişim kur
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Natal Harita Hesaplama</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="İsim"
          className="border p-2 w-full rounded"
        />
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          placeholder="Doğum Tarihi"
          className="border p-2 w-full rounded"
        />
        <input
          type="time"
          name="birthTime"
          value={formData.birthTime}
          onChange={handleChange}
          placeholder="Doğum Saati"
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          name="birthPlace"
          value={formData.birthPlace}
          onChange={handleChange}
          placeholder="Doğum Yeri"
          className="border p-2 w-full rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Hesapla
        </button>
      </form>

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-bold">Sonuç:</h3>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
