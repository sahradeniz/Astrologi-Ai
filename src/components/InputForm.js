import React, { useState } from "react";
import ReactDOM from "react-dom";


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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

      // Tarih formatı kontrolü
  const isValidDate = (date, time) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time);
  };

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

    console.log("Sending Request:", body);

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
      console.log("API Response:", result);
      setResult(result);
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: "An error occurred. Please try again." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label htmlFor="analysisType" className="block font-bold">Analysis Type:</label>
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
        <label htmlFor="birthDate" className="block font-bold">Birth Date:</label>
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
        <label htmlFor="birthTime" className="block font-bold">Birth Time:</label>
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
        <label htmlFor="birthPlace" className="block font-bold">Birth Place:</label>
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
            <label htmlFor="partnerBirthDate" className="block font-bold">Partner Birth Date:</label>
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
            <label htmlFor="partnerBirthTime" className="block font-bold">Partner Birth Time:</label>
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
            <label htmlFor="partnerBirthPlace" className="block font-bold">Partner Birth Place:</label>
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
