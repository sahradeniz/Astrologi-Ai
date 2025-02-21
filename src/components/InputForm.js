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
  useToast
} from "@chakra-ui/react";

const InputForm = ({ setResult }) => {
  const [formData, setFormData] = useState({
    birthDate: "",
    birthTime: "", 
    birthPlace: "",
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError(null); // Clear error when user starts typing
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting form with data:', {
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        location: formData.birthPlace
      });

      const response = await fetch('http://localhost:5003/calculate_natal_chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          location: formData.birthPlace
        }),
      });

      const data = await response.json();
      console.log('Received response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate natal chart');
      }

      if (!data || !data.planet_positions) {
        throw new Error('Invalid response data: missing planet positions');
      }

      // Save to localStorage
      localStorage.setItem('natalChart', JSON.stringify(data));
      console.log('Saved to localStorage:', data);

      // Set result in parent component
      setResult(data);

      // Navigate to character page with data
      navigate('/character', { state: { result: data } });

    } catch (error) {
      console.error('Error in form submission:', error);
      setError(error.message || 'An error occurred while calculating your natal chart');
      toast({
        title: "Error",
        description: error.message || 'An error occurred while calculating your natal chart',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} maxW="500px" mx="auto" bg="white" borderRadius="lg" boxShadow="lg">
      <Text fontSize="2xl" fontWeight="bold" mb={6} textAlign="center">
        Doğum Haritası Hesaplama
      </Text>

      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertTitle mr={2}>Hata!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
