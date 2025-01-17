import React, { useState } from 'react';

function InputForm({ setResult }) {
  const [formData, setFormData] = useState({
    analysisType: "natal", // Varsayılan analiz tipi
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    partnerBirthDate: "",
    partnerBirthTime: "",
    partnerBirthPlace: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Endpoint seçimi
    const url =
      formData.analysisType === "natal"
        ? "https://astrolog-ai.onrender.com/natal-chart"
        : "https://astrolog-ai.onrender.com/synastry-chart";

    // Gönderilecek JSON body
    const body =
      formData.analysisType === "natal"
        ? {
            birth_date: `${formData.birthDate} ${formData.birthTime}:00`, // Doğum tarihi ve saati
            location: formData.birthPlace // Doğum yeri
          }
        : {
            birth_date: `${formData.birthDate} ${formData.birthTime}:00`,
            location: formData.birthPlace,
            partner_birth_date: `${formData.partnerBirthDate} ${formData.partnerBirthTime}:00`, // Partnerin doğum tarihi ve saati
            partner_location: formData.partnerBirthPlace // Partnerin doğum yeri
          };

    try {
      // Backend isteği
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("API hatası. Yanıt alınamadı.");
      }

      // Backend'den dönen yanıt
      const result = await response.json();
      console.log("Backend Yanıtı:", result);
      setResult(result);
    } catch (error) {
      console.error("Hata:", error);
      setResult({ error: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block font-bold">Analysis Type:</label>
        <select
          name="analysisType"
          value={formData.analysisType}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        >
          <option value="natal">Natal Chart</option>
          <option value="synastry">Synastry Chart</option>
        </select>
      </div>

      {/* Common Inputs */}
      <input
        type="date"
        name="birthDate"
        value={formData.birthDate}
        onChange={handleChange}
        placeholder="Birth Date"
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="time"
        name="birthTime"
        value={formData.birthTime}
        onChange={handleChange}
        placeholder="Birth Time"
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="text"
        name="birthPlace"
        value={formData.birthPlace}
        onChange={handleChange}
        placeholder="Birth Place (e.g., Istanbul, Turkey)"
        className="border p-2 w-full rounded"
        required
      />

      {/* Synastry-Specific Inputs */}
      {formData.analysisType === "synastry" && (
        <>
          <input
            type="date"
            name="partnerBirthDate"
            value={formData.partnerBirthDate}
            onChange={handleChange}
            placeholder="Partner Birth Date"
            className="border p-2 w-full rounded"
            required
          />
          <input
            type="time"
            name="partnerBirthTime"
            value={formData.partnerBirthTime}
            onChange={handleChange}
            placeholder="Partner Birth Time"
            className="border p-2 w-full rounded"
            required
          />
          <input
            type="text"
            name="partnerBirthPlace"
            value={formData.partnerBirthPlace}
            onChange={handleChange}
            placeholder="Partner Birth Place (e.g., Ankara, Turkey)"
            className="border p-2 w-full rounded"
            required
          />
        </>
      )}

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Calculate
      </button>
    </form>
  );
}

export default InputForm;
