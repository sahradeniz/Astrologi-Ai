import React, { useState, useEffect } from 'react';
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
  Select,
} from '@chakra-ui/react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUser, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SynastryForm = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const bgLight = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    // Get logged-in user data
    const userData = localStorage.getItem('userData');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }

    // Get friends list
    const friendsList = localStorage.getItem('friends');
    if (friendsList) {
      setFriends(JSON.parse(friendsList));
    }

    // Check for pre-selected friend from friends list
    const preSelectedFriend = localStorage.getItem('selectedFriend');
    if (preSelectedFriend) {
      setSelectedFriend(JSON.parse(preSelectedFriend));
      localStorage.removeItem('selectedFriend'); // Clear after using
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loggedInUser || !selectedFriend) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen bir arkadaş seçin",
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
            birthDate: loggedInUser.birthDate,
            birthTime: loggedInUser.birthTime,
            location: loggedInUser.birthPlace,
          },
          person2: {
            birthDate: selectedFriend.birthDate,
            birthTime: selectedFriend.birthTime,
            location: selectedFriend.birthPlace,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analiz hesaplanamadı');
      }

      // Navigate to results page
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

  if (!loggedInUser) {
    return (
      <Box textAlign="center" p={6}>
        <Text>Lütfen önce giriş yapın.</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Box p={6} borderRadius="lg" bg={bgColor} boxShadow="base">
          <VStack spacing={4} align="stretch">
            <Heading size="md" mb={4}>Uyum Analizi</Heading>

            <Box borderRadius="md" p={4} bg={bgLight}>
              <HStack spacing={4}>
                <Avatar name={loggedInUser.name} size="md" />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{loggedInUser.name}</Text>
                  <Text fontSize="sm">{loggedInUser.birthDate}</Text>
                  <Text fontSize="sm">{loggedInUser.birthPlace}</Text>
                </VStack>
              </HStack>
            </Box>

            <Divider />

            <FormControl isRequired>
              <FormLabel>Arkadaşınızı Seçin</FormLabel>
              <Select
                placeholder="Arkadaş seçin"
                value={selectedFriend ? JSON.stringify(selectedFriend) : ''}
                onChange={(e) => setSelectedFriend(e.target.value ? JSON.parse(e.target.value) : null)}
              >
                {friends.map((friend, index) => (
                  <option key={index} value={JSON.stringify(friend)}>
                    {friend.name} ({friend.birthDate})
                  </option>
                ))}
              </Select>
            </FormControl>

            {selectedFriend && (
              <Box borderRadius="md" p={4} bg={bgLight}>
                <HStack spacing={4}>
                  <Avatar name={selectedFriend.name} size="md" />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{selectedFriend.name}</Text>
                    <Text fontSize="sm">{selectedFriend.birthDate}</Text>
                    <Text fontSize="sm">{selectedFriend.birthPlace}</Text>
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
              leftIcon={<Icon as={FaHeart} />}
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
