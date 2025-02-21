import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  VStack,
  Container,
  Heading,
  Text,
  useToast,
  useColorModeValue,
  Divider,
  HStack,
  Avatar,
  Select,
} from '@chakra-ui/react';
import { FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SynastryForm = () => {
  const [person1, setPerson1] = useState(null);
  const [person2, setPerson2] = useState(null);
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const bgLight = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    // Get current user data
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }

    // Get friends list
    const friendsList = localStorage.getItem('friends');
    if (friendsList) {
      setFriends(JSON.parse(friendsList));
    }

    // Check for pre-selected people from friends list
    const selectedPerson1 = localStorage.getItem('selectedPerson1');
    const selectedPerson2 = localStorage.getItem('selectedPerson2');
    
    if (selectedPerson1) {
      setPerson1(JSON.parse(selectedPerson1));
      localStorage.removeItem('selectedPerson1');
    }
    
    if (selectedPerson2) {
      setPerson2(JSON.parse(selectedPerson2));
      localStorage.removeItem('selectedPerson2');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person1 || !person2) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen iki kişi seçin",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5003/api/calculate-synastry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person1: {
            birthDate: person1.birthDate,
            birthTime: person1.birthTime,
            location: person1.birthPlace,
          },
          person2: {
            birthDate: person2.birthDate,
            birthTime: person2.birthTime,
            location: person2.birthPlace,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analiz hesaplanamadı');
      }

      navigate('/synastry-result', { state: { result: data } });

    } catch (error) {
      toast({
        title: "Hata",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Box textAlign="center" p={6}>
        <Text>Lütfen önce giriş yapın.</Text>
      </Box>
    );
  }

  // Combine current user and friends for selection
  const allPeople = [
    { ...currentUser, name: `${currentUser.name} (Profil Sahibi)` },
    ...friends
  ];

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Box p={6} borderRadius="lg" bg={bgColor} boxShadow="base">
          <VStack spacing={4} align="stretch">
            <Heading size="md" mb={4}>Uyum Analizi</Heading>

            <FormControl isRequired>
              <FormLabel>Birinci Kişi</FormLabel>
              <Select
                placeholder="Kişi seçin"
                value={person1 ? JSON.stringify(person1) : ''}
                onChange={(e) => setPerson1(e.target.value ? JSON.parse(e.target.value) : null)}
              >
                {allPeople.map((person, index) => (
                  <option key={index} value={JSON.stringify(person)}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {person1 && (
              <Box borderRadius="md" p={4} bg={bgLight}>
                <HStack spacing={4}>
                  <Avatar name={person1.name} size="md" />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{person1.name}</Text>
                    <Text fontSize="sm">{person1.birthDate}</Text>
                    <Text fontSize="sm">{person1.birthPlace}</Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            <Divider />

            <FormControl isRequired>
              <FormLabel>İkinci Kişi</FormLabel>
              <Select
                placeholder="Kişi seçin"
                value={person2 ? JSON.stringify(person2) : ''}
                onChange={(e) => setPerson2(e.target.value ? JSON.parse(e.target.value) : null)}
                isDisabled={!person1}
              >
                {allPeople
                  .filter(person => !person1 || person.name !== person1.name)
                  .map((person, index) => (
                    <option key={index} value={JSON.stringify(person)}>
                      {person.name}
                    </option>
                  ))}
              </Select>
            </FormControl>

            {person2 && (
              <Box borderRadius="md" p={4} bg={bgLight}>
                <HStack spacing={4}>
                  <Avatar name={person2.name} size="md" />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{person2.name}</Text>
                    <Text fontSize="sm">{person2.birthDate}</Text>
                    <Text fontSize="sm">{person2.birthPlace}</Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            <Button
              colorScheme="purple"
              size="lg"
              width="full"
              onClick={handleSubmit}
              isLoading={isLoading}
              leftIcon={<FaHeart />}
              isDisabled={!person1 || !person2}
            >
              Uyum Analizi Yap
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default SynastryForm;
