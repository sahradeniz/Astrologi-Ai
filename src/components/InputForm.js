import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage
} from "@chakra-ui/react";

const API_URL = 'http://localhost:5003';

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

  const validateForm = () => {
    if (!formData.birthDate) {
      setError('Birth date is required');
      return false;
    }
    if (!formData.birthTime) {
      setError('Birth time is required');
      return false;
    }
    if (!formData.birthPlace) {
      setError('Birth place is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting form with data:', {
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        location: formData.birthPlace
      });

      const response = await fetch(`${API_URL}/calculate_natal_chart`, {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response:', data);

      if (!data || !data.planet_positions) {
        throw new Error('Invalid response data: missing planet positions');
      }

      // Save to localStorage
      localStorage.setItem('natalChart', JSON.stringify(data));
      console.log('Saved to localStorage:', data);

      // Set result in parent component
      setResult(data);

      // Show success message
      toast({
        title: "Success",
        description: "Your natal chart has been calculated!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

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
          <AlertIcon />
          <Box>
            <AlertTitle mr={2}>Hata!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired isInvalid={error && !formData.birthDate}>
            <FormLabel>Doğum Tarihi</FormLabel>
            <Input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
            />
            <FormErrorMessage>Birth date is required</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={error && !formData.birthTime}>
            <FormLabel>Doğum Saati</FormLabel>
            <Input
              type="time"
              name="birthTime"
              value={formData.birthTime}
              onChange={handleChange}
              placeholder="HH:MM"
            />
            <FormErrorMessage>Birth time is required</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={error && !formData.birthPlace}>
            <FormLabel>Doğum Yeri</FormLabel>
            <Input
              type="text"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleChange}
              placeholder="Şehir, Ülke"
            />
            <FormErrorMessage>Birth place is required</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            colorScheme="purple"
            width="100%"
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
