import React, { useState } from "react"; // useState kullanıyoruz
import { useNavigate } from "react-router-dom"; // Sayfa yönlendirmesi için useNavigate'i import ediyoruz
import './InputForm.css'; // Custom styles for the input form

function InputForm({ setResult }) {
  const [formData, setFormData] = useState({
    analysisType: "natal",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    partnerBirthDate: "",
    partnerBirthTime: "",
    partnerBirthPlace: "",
  });

  const navigate = useNavigate(); // useNavigate Hook'u ile yönlendirme işlemi

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Doğum tarihi ve saati format doğrulama
  const isValidDate = (date, time) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD formatı
    const timeRegex = /^\d{2}:\d{2}$/; // HH:MM formatı
    return dateRegex.test(date) && timeRegex.test(time);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Gerekli alanların doğrulaması
    if (
      !formData.birthDate ||
      !formData.birthTime ||
      !formData.birthPlace ||
      (formData.analysisType === "synastry" &&
        (!formData.partnerBirthDate ||
          !formData.partnerBirthTime ||
          !formData.partnerBirthPlace))
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Format doğrulaması
    if (
      !isValidDate(formData.birthDate, formData.birthTime) ||
      (formData.analysisType === "synastry" &&
        !isValidDate(formData.partnerBirthDate, formData.partnerBirthTime))
    ) {
      alert("Please enter valid date and time formats.");
      return;
    }

    const url =
      formData.analysisType === "natal"
        ? "https://astrolog-ai.onrender.com/natal-chart"
        : "https://astrolog-ai.onrender.com/synastry-chart";

    const body =
      formData.analysisType === "natal"
        ? {
            birth_date: `${formData.birthDate} ${formData.birthTime}:00`,
            location: formData.birthPlace,
          }
        : {
            birth_date: `${formData.birthDate} ${formData.birthTime}:00`,
            location: formData.birthPlace,
            partner_birth_date: `${formData.partnerBirthDate} ${formData.partnerBirthTime}:00`,
            partner_location: formData.partnerBirthPlace,
          };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("API error: Response not ok.");
      }

      const result = await response.json();
      setResult(result); // API'den dönen veriyi Result bileşenine gönder
      navigate('/results'); // Sonuç sayfasına yönlendiriyoruz
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: "An error occurred. Please try again." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label htmlFor="analysisType" className="block font-bold">
          Analysis Type:
        </label>
        <select
          id="analysisType"
          name="analysisType"
          value={formData.analysisType}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        >
          <option value="natal">Natal Chart</option>
          <option value="synastry">Synastry Chart</option>
        </select>
      </div>

      <div>
        <label htmlFor="birthDate" className="block font-bold">
          Birth Date:
        </label>
        <input
          id="birthDate"
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="birthTime" className="block font-bold">
          Birth Time:
        </label>
        <input
          id="birthTime"
          type="time"
          name="birthTime"
          value={formData.birthTime}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="birthPlace" className="block font-bold">
          Birth Place:
        </label>
        <input
          id="birthPlace"
          type="text"
          name="birthPlace"
          value={formData.birthPlace}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
      </div>

      {formData.analysisType === "synastry" && (
        <>
          <div>
            <label htmlFor="partnerBirthDate" className="block font-bold">
              Partner Birth Date:
            </label>
            <input
              id="partnerBirthDate"
              type="date"
              name="partnerBirthDate"
              value={formData.partnerBirthDate}
              onChange={handleChange}
              className="border p-2 w-full rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="partnerBirthTime" className="block font-bold">
              Partner Birth Time:
            </label>
            <input
              id="partnerBirthTime"
              type="time"
              name="partnerBirthTime"
              value={formData.partnerBirthTime}
              onChange={handleChange}
              className="border p-2 w-full rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="partnerBirthPlace" className="block font-bold">
              Partner Birth Place:
            </label>
            <input
              id="partnerBirthPlace"
              type="text"
              name="partnerBirthPlace"
              value={formData.partnerBirthPlace}
              onChange={handleChange}
              className="border p-2 w-full rounded"
              required
            />
          </div>
        </>
      )}

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Calculate
      </button>
    </form>
  );
}

export default InputForm;
