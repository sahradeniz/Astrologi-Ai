import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

const InputForm = ({ setResult }) => {
  const [formData, setFormData] = useState({
    birthDate: "",
    birthTime: "", 
    birthPlace: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrorMessage(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (!formData.birthDate || !formData.birthTime || !formData.birthPlace) {
      setErrorMessage("Lütfen tüm alanları doldurun.");
      setIsLoading(false);
      return;
    }

    const body = {
      birth_date: `${formData.birthDate} ${formData.birthTime}:00`,
      location: formData.birthPlace,
    };

    console.log("Sending request with body:", body);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
      console.log('Using API URL:', API_URL);
      
      const response = await fetch(`${API_URL}/api/calculate-natal`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API error: Response not ok.");
      }

      const data = await response.json();
      console.log("Raw API Response:", JSON.stringify(data, null, 2));
      
      // Check if data is an object with the expected properties
      if (!data || typeof data !== 'object') {
        console.error("Invalid data format - not an object:", data);
        throw new Error("Invalid data format received from API");
      }

      // Extract the relevant data, handling both English and Turkish keys
      const formattedResult = {
        planet_positions: data.planet_positions || data.planets || data.gezegenler || [],
        aspects: data.aspects || data.açılar || {},
        house_positions: data.houses || data.house_positions || data.evler || [],
      };

      console.log("Formatted Result:", JSON.stringify(formattedResult, null, 2));

      // Validate the formatted data
      if (!formattedResult.planet_positions.length) {
        console.error("Missing planet positions in API response");
        throw new Error("Missing planet positions in API response");
      }

      setResult(formattedResult);
      navigate("/results");
    } catch (error) {
      console.error("Error details:", error);
      setErrorMessage(
        error.message === "Invalid data format received from API"
          ? "API yanıtı beklenen formatta değil. Lütfen tekrar deneyin."
          : error.message === "Missing planet positions in API response"
          ? "Gezegen pozisyonları alınamadı. Lütfen tekrar deneyin."
          : error.message || "Bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} maxW="500px" mx="auto" bg="white" borderRadius="lg" boxShadow="lg">
      <Text fontSize="2xl" fontWeight="bold" mb={6} textAlign="center">
        Doğum Haritası Hesaplama
      </Text>

      {errorMessage && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertTitle>Hata!</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={6}>
          <Box w="100%">
            <Text fontWeight="bold" mb={2}>Doğum Tarihi</Text>
            <Input
              id="birthDate"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              bg="gray.50"
              focusBorderColor="blue.400"
              size="lg"
            />
          </Box>

          <Box w="100%">
            <Text fontWeight="bold" mb={2}>Doğum Saati</Text>
            <Input
              id="birthTime"
              type="time"
              name="birthTime"
              value={formData.birthTime}
              onChange={handleChange}
              bg="gray.50"
              focusBorderColor="blue.400"
              size="lg"
            />
          </Box>

          <Box w="100%">
            <Text fontWeight="bold" mb={2}>Doğum Yeri</Text>
            <Input
              id="birthPlace"
              type="text"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleChange}
              bg="gray.50"
              focusBorderColor="blue.400"
              size="lg"
              placeholder="Şehir, Ülke"
            />
          </Box>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            w="full"
            isLoading={isLoading}
            loadingText="Hesaplanıyor..."
          >
            Hesapla
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default InputForm;
