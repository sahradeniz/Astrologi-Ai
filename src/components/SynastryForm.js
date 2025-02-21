import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Container,
  Heading,
  Text,
  useToast,
  useColorModeValue,
  FormErrorMessage,
  InputGroup,
  InputLeftElement,
  Icon,
  Divider,
  HStack,
  Avatar,
} from '@chakra-ui/react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUser, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SynastryForm = () => {
  const [person1Data, setPerson1Data] = useState(() => {
    // Try to get saved natal chart data
    const savedData = localStorage.getItem('natalChartData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return {
        name: parsed.name || '',
        birthDate: parsed.birthDate || '',
        birthTime: parsed.birthTime || '',
        birthPlace: parsed.birthPlace || '',
      };
    }
    return {
      name: '',
      birthDate: '',
      birthTime: '',
      birthPlace: '',
    };
  });

  const [person2Data, setPerson2Data] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const validateForm = () => {
    const newErrors = {};
    if (!person2Data.name) newErrors.name = "İsim gerekli";
    if (!person2Data.birthDate) newErrors.birthDate = "Doğum tarihi gerekli";
    if (!person2Data.birthTime) newErrors.birthTime = "Doğum saati gerekli";
    if (!person2Data.birthPlace) newErrors.birthPlace = "Doğum yeri gerekli";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5003/calculate_synastry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person1: person1Data,
          person2: person2Data,
        }),
      });

      if (!response.ok) {
        throw new Error("Sunucu hatası");
      }

      const data = await response.json();
      
      // Save partner data to friends list
      const friends = JSON.parse(localStorage.getItem('friends') || '[]');
      if (!friends.some(friend => 
        friend.birthDate === person2Data.birthDate && 
        friend.birthTime === person2Data.birthTime
      )) {
        friends.push(person2Data);
        localStorage.setItem('friends', JSON.stringify(friends));
      }

      localStorage.setItem("synastryData", JSON.stringify(data));
      navigate("/synastry-result");
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Hata",
        description: "Uyum analizi hesaplanırken bir hata oluştu.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <Box
        p={8}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        shadow="xl"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="xl" mb={2}>
              Uyum Analizi
            </Heading>
            <Text color="gray.600">
              Partner bilgilerini girerek astrolojik uyumunuzu analiz edin
            </Text>
          </Box>

          {/* Person 1 (Current User) Info Display */}
          <Box p={4} bg="purple.50" borderRadius="lg">
            <HStack spacing={4}>
              <Avatar size="md" name={person1Data.name} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{person1Data.name || "Siz"}</Text>
                <Text fontSize="sm" color="gray.600">
                  {person1Data.birthDate} - {person1Data.birthPlace}
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Divider />

          {/* Person 2 Form */}
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={errors.name}>
                <FormLabel>Partner İsmi</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaUser} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    value={person2Data.name}
                    onChange={(e) =>
                      setPerson2Data({ ...person2Data, name: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.birthDate}>
                <FormLabel>Doğum Tarihi</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaCalendar} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="date"
                    value={person2Data.birthDate}
                    onChange={(e) =>
                      setPerson2Data({ ...person2Data, birthDate: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.birthDate}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.birthTime}>
                <FormLabel>Doğum Saati</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaClock} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="time"
                    value={person2Data.birthTime}
                    onChange={(e) =>
                      setPerson2Data({ ...person2Data, birthTime: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.birthTime}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.birthPlace}>
                <FormLabel>Doğum Yeri</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaMapMarkerAlt} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Şehir, Ülke"
                    value={person2Data.birthPlace}
                    onChange={(e) =>
                      setPerson2Data({ ...person2Data, birthPlace: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.birthPlace}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                width="full"
                isLoading={isLoading}
                loadingText="Hesaplanıyor..."
                mt={6}
                leftIcon={<Icon as={FaHeart} />}
              >
                Uyumu Analiz Et
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default SynastryForm;
