import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Progress,
  Card,
  CardBody,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  useToast,
  HStack,
  Avatar,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

const MotionBox = motion(Box);

const SynastryPage = () => {
  const [synastryData, setSynastryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');

  const handleImageError = () => {
    setAvatarError(true);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const fetchSynastryData = async () => {
      try {
        setIsLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const person1Id = searchParams.get('person1');
        const person2Id = searchParams.get('person2');

        if (!person1Id || !person2Id) {
          throw new Error('Kişi bilgileri eksik');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch both users' data
        const [person1Response, person2Response] = await Promise.all([
          fetch(`${API_URL}/api/user/${person1Id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/friends/${person1Id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!person1Response.ok || !person2Response.ok) {
          throw new Error('Kişi bilgileri alınamadı');
        }

        const person1Data = await person1Response.json();
        const friendsData = await person2Response.json();
        const person2Data = friendsData.friends.find(friend => friend._id === person2Id);

        if (!person2Data) {
          throw new Error('Arkadaş bilgisi bulunamadı');
        }

        // Calculate synastry
        const synastryResponse = await fetch(`${API_URL}/api/synastry`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            person1: {
              birthDate: person1Data.birthDate,
              birthTime: person1Data.birthTime,
              birthPlace: person1Data.birthPlace,
            },
            person2: {
              birthDate: person2Data.birthDate,
              birthTime: person2Data.birthTime,
              birthPlace: person2Data.birthPlace,
            },
          }),
        });

        if (!synastryResponse.ok) {
          throw new Error('Uyum analizi hesaplanamadı');
        }

        const synastryResult = await synastryResponse.json();
        setSynastryData({
          ...synastryResult,
          person1Name: person1Data.name,
          person2Name: person2Data.name,
        });
      } catch (err) {
        setError(err.message);
        toast({
          title: 'Hata',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSynastryData();
  }, [location, navigate, toast]);

  const renderSynastryResults = () => {
    if (!synastryData) return null;

    return (
      <VStack spacing={6} w="100%">
        <HStack spacing={4} justify="center" align="center">
          <VStack>
            <Avatar
              name={synastryData.person1Name}
              size="lg"
              bg={avatarError ? "purple.500" : undefined}
              onError={handleImageError}
            >
              {getInitials(synastryData.person1Name)}
            </Avatar>
            <Text fontWeight="bold">{synastryData.person1Name}</Text>
          </VStack>
          <Text fontSize="2xl" color="purple.500">❤</Text>
          <VStack>
            <Avatar
              name={synastryData.person2Name}
              size="lg"
              bg={avatarError ? "purple.500" : undefined}
              onError={handleImageError}
            >
              {getInitials(synastryData.person2Name)}
            </Avatar>
            <Text fontWeight="bold">{synastryData.person2Name}</Text>
          </VStack>
        </HStack>

        <Text textAlign="center" color="gray.500" fontSize="lg">
          Astrolojik Uyum Analizi
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
          {Object.entries(synastryData.aspects).map(([aspect, value]) => (
            <MotionBox
              key={aspect}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card bg={bgColor} h="100%">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="md">{aspect}</Heading>
                    <Progress
                      value={value * 100}
                      colorScheme={value >= 0.7 ? "green" : value >= 0.4 ? "yellow" : "red"}
                      w="100%"
                      borderRadius="full"
                      height="20px"
                    />
                    <Text fontWeight="bold" fontSize="lg">
                      {Math.round(value * 100)}% Uyum
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>
          ))}
        </SimpleGrid>

        <Button
          colorScheme="purple"
          onClick={() => navigate('/profile')}
          mt={6}
          size="lg"
        >
          Profile Dön
        </Button>
      </VStack>
    );
  };

  if (isLoading) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="purple.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <VStack align="start">
            <Text fontWeight="bold">Hata oluştu</Text>
            <Text>{error}</Text>
            <Button colorScheme="purple" size="sm" onClick={() => navigate('/profile')}>
              Profile Dön
            </Button>
          </VStack>
        </Alert>
      </Container>
    );
  }

  if (!synastryData) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <VStack align="start">
            <Text fontWeight="bold">Veri Bulunamadı</Text>
            <Text>Uyum analizi için gerekli veriler bulunamadı.</Text>
            <Button colorScheme="purple" size="sm" onClick={() => navigate('/profile')}>
              Profile Dön
            </Button>
          </VStack>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      {renderSynastryResults()}
    </Container>
  );
};

export default SynastryPage;
