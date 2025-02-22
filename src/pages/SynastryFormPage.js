import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  useColorModeValue,
  Avatar,
  HStack,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { API_URL, DEFAULT_AVATAR } from '../config';

const SynastryFormPage = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${API_URL}/api/friends/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Arkadaş listesi alınamadı');
      }

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!selectedFriend) {
        throw new Error('Lütfen bir arkadaş seçin');
      }

      const friend = friends.find(f => f._id === selectedFriend);
      if (!friend) {
        throw new Error('Seçilen arkadaş bulunamadı');
      }

      // Get current user's data
      const userId = localStorage.getItem('userId');
      const userResponse = await fetch(`${API_URL}/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }

      const userData = await userResponse.json();

      // Get friend's data
      const friendResponse = await fetch(`${API_URL}/api/user/${friend._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!friendResponse.ok) {
        throw new Error('Arkadaş bilgileri alınamadı');
      }

      const friendData = await friendResponse.json();

      // Calculate synastry
      const synastryResponse = await fetch(`${API_URL}/api/calculate-synastry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          person1: {
            name: userData.name,
            birthDate: userData.birthDate,
            birthTime: userData.birthTime,
            birthPlace: userData.birthPlace
          },
          person2: {
            name: friendData.name,
            birthDate: friendData.birthDate,
            birthTime: friendData.birthTime,
            birthPlace: friendData.birthPlace
          }
        })
      });

      if (!synastryResponse.ok) {
        const error = await synastryResponse.json();
        throw new Error(error.error || 'Uyum analizi hesaplanamadı');
      }

      const result = await synastryResponse.json();
      
      // Navigate to results page with data
      navigate('/synastry/results', { 
        state: { 
          result,
          person1: userData,
          person2: friendData
        }
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={2}>Uyum Analizi</Heading>
          <Text color="gray.500">
            Astrolojik uyumunuzu öğrenmek için arkadaşınızı seçin
          </Text>
        </Box>

        <Box
          bg={useColorModeValue('white', 'gray.700')}
          p={6}
          borderRadius="lg"
          boxShadow="sm"
        >
          <VStack spacing={6}>
            {/* Current User Info */}
            <Box width="full">
              <Text fontWeight="bold" mb={2}>Sizin Bilgileriniz</Text>
              <HStack spacing={4}>
                <Avatar
                  size="md"
                  name={localStorage.getItem('name')}
                  src={DEFAULT_AVATAR}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">
                    {localStorage.getItem('name')}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {localStorage.getItem('birthDate')}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Divider />

            {/* Friend Selection */}
            <FormControl isRequired>
              <FormLabel>Arkadaşınızı Seçin</FormLabel>
              <Select
                placeholder="Arkadaş seçin"
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
              >
                {friends.map((friend) => (
                  <option key={friend._id} value={friend._id}>
                    {friend.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Button
              colorScheme="purple"
              size="lg"
              width="full"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Uyumu Hesapla
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default SynastryFormPage;
