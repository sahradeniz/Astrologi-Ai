import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text,
  Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const InputForm = () => {
  const [formData, setFormData] = useState({
    birth_date: '',
    birth_time: '',
    birth_place: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate date format
      const datePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
      const dateMatch = formData.birth_date.match(datePattern);
      
      if (!dateMatch) {
        throw new Error('Geçersiz tarih formatı. Lütfen GG.AA.YYYY formatında girin');
      }

      const [_, day, month, year] = dateMatch;
      
      // Validate date components
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (monthNum < 1 || monthNum > 12) {
        throw new Error('Geçersiz ay');
      }

      if (dayNum < 1 || dayNum > 31) {
        throw new Error('Geçersiz gün');
      }

      // Validate time format
      const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timePattern.test(formData.birth_time)) {
        throw new Error('Geçersiz saat formatı. Lütfen SS:DD formatında girin');
      }

      // Validate location
      if (!formData.birth_place.trim()) {
        throw new Error('Lütfen doğum yerini girin');
      }

      if (formData.birth_place.trim().length < 2) {
        throw new Error('Doğum yeri çok kısa');
      }

      // Format time properly
      const [hours, minutes] = formData.birth_time.split(':').map(num => num.padStart(2, '0'));
      
      // Format data
      const formattedData = {
        birth_date: `${dayNum.toString().padStart(2, '0')}.${monthNum.toString().padStart(2, '0')}.${yearNum}`,
        birth_time: `${hours}:${minutes}`,
        birth_place: formData.birth_place.trim()
      };

      console.log('Submitting formatted data:', formattedData);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      console.log('Using API URL:', API_URL);
      const endpoint = `${API_URL}/api/calculate-birth-chart`;
      console.log('Full endpoint URL:', endpoint);
      
      try {
        console.log('Making API request with data:', formattedData);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(formattedData),
          mode: 'cors'
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));
        
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
          console.error('API error response:', data);
          throw new Error(data.details || data.error || 'API request failed');
        }

        if (!data || typeof data !== 'object') {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid API response format');
        }

        if (!data.planet_positions || typeof data.planet_positions !== 'object') {
          console.error('Missing or invalid planet positions in response:', data);
          throw new Error('Missing or invalid planet positions in API response');
        }

        // Store the chart data in localStorage
        console.log('Storing chart data in localStorage:', data);
        localStorage.setItem('natalChart', JSON.stringify(data));

        // Navigate to character page
        navigate('/character');

        toast({
          title: 'Başarılı!',
          description: 'Doğum haritanız hazırlandı.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error('API call error:', error);
        console.error('Error stack:', error.stack);
        toast({
          title: 'Hata',
          description: error.message || 'Bir hata oluştu',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: error.message || 'Bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderRadius="lg" boxShadow="lg" bg="white">
      <VStack spacing={6}>
        <Heading size="lg">Doğum Bilgileri</Heading>
        <Text color="gray.600">
          Lütfen doğum bilgilerinizi girin
        </Text>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Doğum Tarihi</FormLabel>
              <Input
                type="text"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                placeholder="GG.AA.YYYY"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Doğum Saati</FormLabel>
              <Input
                type="time"
                name="birth_time"
                value={formData.birth_time}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Doğum Yeri</FormLabel>
              <Input
                type="text"
                name="birth_place"
                value={formData.birth_place}
                onChange={handleInputChange}
                placeholder="Şehir, Ülke"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="purple"
              size="lg"
              width="100%"
              isLoading={isLoading}
              loadingText="Hesaplanıyor..."
            >
              Doğum Haritamı Hesapla
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default InputForm;
