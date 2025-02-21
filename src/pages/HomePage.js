import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  useColorModeValue,
  Icon,
  HStack,
  Avatar,
  Spacer,
  Button,
  IconButton,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import { FaStar, FaMoon, FaSun, FaHeart, FaRobot, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { API_URL, DEFAULT_AVATAR } from '../config';

const MotionBox = motion(Box);

const FeatureCard = ({ icon: Icon, title, description, onClick }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  return (
    <Box
      as={onClick ? 'button' : 'div'}
      onClick={onClick}
      p={6}
      bg={bgColor}
      borderRadius="lg"
      boxShadow="md"
      transition="all 0.2s"
      _hover={onClick ? {
        bg: hoverBg,
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      } : {}}
      textAlign="left"
      width="100%"
    >
      <VStack align="start" spacing={4}>
        <Icon size={24} color="#805AD5" />
        <Box>
          <Heading size="md" mb={2}>{title}</Heading>
          <Text color="gray.500">{description}</Text>
        </Box>
        {onClick && (
          <HStack color="purple.500">
            <Text>Başla</Text>
            <FaArrowRight size={12} />
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

const HomePage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const [showSynastryForm, setShowSynastryForm] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [synastryResult, setSynastryResult] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSynastrySubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Lütfen giriş yapın');
      }

      console.log('Fetching user data for synastry...');
      const response = await fetch(`${API_URL}/api/user/${userId}`);
      const userData = await response.json();

      console.log('User data response:', userData);

      if (!response.ok) {
        throw new Error(userData.error || 'Kullanıcı bilgileri alınamadı');
      }

      // Check if user has birth data
      if (!userData.birthDate || !userData.birthTime || !userData.birthPlace) {
        throw new Error('Lütfen profil ayarlarından kendi doğum bilgilerinizi ekleyin');
      }

      // Check partner data
      if (!selectedFriend) {
        throw new Error('Lütfen bir arkadaş seçin');
      }

      console.log('Selected friend:', selectedFriend);

      // Get friend's data
      const friendResponse = await fetch(`${API_URL}/api/user/${selectedFriend._id}`);
      const friendData = await friendResponse.json();

      if (!friendResponse.ok) {
        throw new Error('Arkadaş bilgileri alınamadı');
      }

      // Check friend's birth data
      if (!friendData.birthDate || !friendData.birthTime || !friendData.birthPlace) {
        throw new Error('Seçilen arkadaşın doğum bilgileri eksik');
      }

      console.log('Sending synastry request with:', {
        person1: userData,
        person2: friendData
      });

      const synastryResponse = await fetch(`${API_URL}/api/calculate-synastry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        }),
      });

      const synastryData = await synastryResponse.json();
      console.log('Synastry response:', synastryData);

      if (!synastryResponse.ok) {
        throw new Error(synastryData.error || 'Uyum analizi hesaplaması başarısız oldu');
      }

      setSynastryResult(synastryData);
      
      toast({
        title: 'Başarılı',
        description: 'Uyum analizi hesaplandı',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate to results page
      navigate('/synastry-results', { 
        state: { 
          result: synastryData,
          person1: userData,
          person2: friendData
        } 
      });

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      toast({
        title: 'Hata',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" color={textColor}>
                Hoş geldin
              </Text>
              <Heading size="xl" color={textColor}>
                {localStorage.getItem('name') || 'Astroloji Keşfi'}
              </Heading>
            </VStack>
            <Avatar
              size="md"
              name={localStorage.getItem('name')}
              src={DEFAULT_AVATAR}
            />
          </HStack>

          {/* Synastry Analysis Section */}
          <Box
            w="full"
            p={8}
            bg="purple.500"
            borderRadius="2xl"
            color="white"
            position="relative"
            overflow="hidden"
          >
            {!showSynastryForm ? (
              <VStack align="start" spacing={4}>
                <HStack>
                  <Icon as={FaHeart} boxSize={8} />
                  <Heading size="lg">Uyum Analizi</Heading>
                </HStack>
                <Text fontSize="lg">
                  Astrolojik uyumunuzu öğrenmek için partner bilgilerini girin
                </Text>
                <Button
                  colorScheme="whiteAlpha"
                  size="lg"
                  rightIcon={<FaArrowRight />}
                  onClick={() => setShowSynastryForm(true)}
                >
                  Hemen Başla
                </Button>
              </VStack>
            ) : (
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Heading size="lg">Partner Bilgileri</Heading>
                  <IconButton
                    icon={<FaArrowLeft />}
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    onClick={() => setShowSynastryForm(false)}
                    aria-label="Back"
                  />
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* Current User Info */}
                  <Box
                    p={4}
                    bg="whiteAlpha.200"
                    borderRadius="lg"
                    backdropFilter="blur(10px)"
                  >
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="whiteAlpha.700">
                        Sizin Bilgileriniz
                      </Text>
                      <HStack spacing={4}>
                        <Avatar 
                          size="md" 
                          name={localStorage.getItem('name')} 
                          src={DEFAULT_AVATAR}
                        />
                        <Box>
                          <Text fontWeight="bold">
                            {localStorage.getItem('name') || 'Siz'}
                          </Text>
                          <Text fontSize="sm" color="whiteAlpha.700">
                            {localStorage.getItem('birthDate') || 'Doğum tarihiniz'}
                          </Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Partner Form */}
                  <Box
                    p={4}
                    bg="whiteAlpha.200"
                    borderRadius="lg"
                    backdropFilter="blur(10px)"
                  >
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel color="whiteAlpha.900">Partner İsmi</FormLabel>
                        <Input
                          variant="filled"
                          bg="whiteAlpha.300"
                          _hover={{ bg: 'whiteAlpha.400' }}
                          _focus={{ bg: 'whiteAlpha.500' }}
                          placeholder="İsim girin"
                          value={selectedFriend ? selectedFriend.name : ''}
                          onChange={(e) => setSelectedFriend({ name: e.target.value })}
                        />
                      </FormControl>
                      <Button
                        colorScheme="whiteAlpha"
                        width="full"
                        rightIcon={<FaHeart />}
                        onClick={handleSynastrySubmit}
                        isLoading={isLoading}
                      >
                        Uyumu Hesapla
                      </Button>
                    </VStack>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}
          </Box>

          {/* Features Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
            <FeatureCard
              icon={FaStar}
              title="Natal Harita"
              description="Doğum haritanızı hesaplayın ve detaylı yorumları keşfedin."
            />
            <FeatureCard
              icon={FaMoon}
              title="Ay Fazları"
              description="Ay'ın günlük pozisyonları ve bunların etkileri hakkında bilgi edinin."
            />
            <FeatureCard
              icon={FaSun}
              title="Gezegen Transitler"
              description="Gezegenlerin geçişlerini ve hayatınıza etkileri hakkında bilgi edinin."
            />
            <FeatureCard
              icon={FaHeart}
              title="Uyum Analizi"
              description="İlişki ve uyum analizleri ile astrolojik uyumunuzu keşfedin."
            />
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default HomePage;
