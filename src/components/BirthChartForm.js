import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const BirthChartForm = () => {
  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.birthDate) newErrors.birthDate = 'Doğum tarihi gerekli';
    if (!formData.birthTime) newErrors.birthTime = 'Doğum saati gerekli';
    if (!formData.location) newErrors.location = 'Doğum yeri gerekli';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/calculate_natal_chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Doğum haritası hesaplanırken bir hata oluştu');
      }

      // Store the chart data in localStorage
      localStorage.setItem('natalChart', JSON.stringify(data));

      toast({
        title: 'Başarılı!',
        description: 'Doğum haritanız hesaplandı.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate to character page to display the chart
      navigate('/character');
    } catch (error) {
      console.error('Error calculating birth chart:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%" maxW="400px" mx="auto">
      <VStack spacing={4}>
        <FormControl isInvalid={!!errors.birthDate}>
          <FormLabel>Doğum Tarihi</FormLabel>
          <Input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
          />
          <FormErrorMessage>{errors.birthDate}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.birthTime}>
          <FormLabel>Doğum Saati</FormLabel>
          <Input
            type="time"
            name="birthTime"
            value={formData.birthTime}
            onChange={handleChange}
          />
          <FormErrorMessage>{errors.birthTime}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.location}>
          <FormLabel>Doğum Yeri</FormLabel>
          <Input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Örn: Istanbul, Turkey"
          />
          <FormErrorMessage>{errors.location}</FormErrorMessage>
        </FormControl>

        <Button
          type="submit"
          colorScheme="purple"
          width="100%"
          isLoading={isLoading}
        >
          Doğum Haritamı Hesapla
        </Button>
      </VStack>
    </Box>
  );
};

export default BirthChartForm;
