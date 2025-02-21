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
import { FaStar, FaMoon, FaSun, FaHeart, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

const MotionBox = motion(Box);

const FeatureCard = ({ icon, title, description }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <MotionBox
      whileHover={{ y: -5 }}
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      shadow="md"
    >
      <VStack spacing={4} align="start">
        <Icon as={icon} boxSize={8} color="purple.500" />
        <Heading size="md">{title}</Heading>
        <Text color="gray.600">{description}</Text>
      </VStack>
    </MotionBox>
  );
};

const HomePage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const [showSynastryForm, setShowSynastryForm] = useState(false);
  const [partnerData, setPartnerData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSynastrySubmit = async () => {
    if (!partnerData.name || !partnerData.birthDate) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen gerekli alanları doldurun",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get current user's data from localStorage
      const userData = {
        name: localStorage.getItem('userName'),
        birthDate: localStorage.getItem('userBirthDate'),
        birthTime: localStorage.getItem('userBirthTime'),
        birthPlace: localStorage.getItem('userBirthPlace')
      };

      const response = await fetch("http://localhost:5003/calculate_synastry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person1: userData,
          person2: partnerData
        }),
      });

      if (!response.ok) {
        throw new Error("Sunucu hatası");
      }

      const data = await response.json();
      
      // Save partner to friends list
      const friends = JSON.parse(localStorage.getItem('friends') || '[]');
      if (!friends.some(friend => 
        friend.birthDate === partnerData.birthDate && 
        friend.birthTime === partnerData.birthTime
      )) {
        friends.push(partnerData);
        localStorage.setItem('friends', JSON.stringify(friends));
      }

      // Save synastry result and navigate
      localStorage.setItem("synastryData", JSON.stringify(data));
      navigate("/synastry-result");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Hata",
        description: "Uyum analizi hesaplanırken bir hata oluştu",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" pt={8} pb={20}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          {/* Header */}
          <Box w="full" mb={8}>
            <HStack>
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" color="gray.600">
                  Hoş geldin
                </Text>
                <Heading size="xl" color={textColor}>
                  {localStorage.getItem('userName') || 'Astroloji Keşfi'}
                </Heading>
              </VStack>
              <Spacer />
              <Avatar 
                size="md" 
                name={localStorage.getItem('userName')} 
                src="https://bit.ly/broken-link" 
              />
            </HStack>
          </Box>

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
                          name={localStorage.getItem('userName')} 
                        />
                        <Box>
                          <Text fontWeight="bold">
                            {localStorage.getItem('userName') || 'Siz'}
                          </Text>
                          <Text fontSize="sm" color="whiteAlpha.700">
                            {localStorage.getItem('userBirthDate') || 'Doğum tarihiniz'}
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
                          value={partnerData.name}
                          onChange={(e) => setPartnerData({
                            ...partnerData,
                            name: e.target.value
                          })}
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel color="whiteAlpha.900">Doğum Tarihi</FormLabel>
                        <Input
                          variant="filled"
                          bg="whiteAlpha.300"
                          _hover={{ bg: 'whiteAlpha.400' }}
                          _focus={{ bg: 'whiteAlpha.500' }}
                          type="date"
                          value={partnerData.birthDate}
                          onChange={(e) => setPartnerData({
                            ...partnerData,
                            birthDate: e.target.value
                          })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel color="whiteAlpha.900">Doğum Saati</FormLabel>
                        <Input
                          variant="filled"
                          bg="whiteAlpha.300"
                          _hover={{ bg: 'whiteAlpha.400' }}
                          _focus={{ bg: 'whiteAlpha.500' }}
                          type="time"
                          value={partnerData.birthTime}
                          onChange={(e) => setPartnerData({
                            ...partnerData,
                            birthTime: e.target.value
                          })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel color="whiteAlpha.900">Doğum Yeri</FormLabel>
                        <Input
                          variant="filled"
                          bg="whiteAlpha.300"
                          _hover={{ bg: 'whiteAlpha.400' }}
                          _focus={{ bg: 'whiteAlpha.500' }}
                          placeholder="Şehir, Ülke"
                          value={partnerData.birthPlace}
                          onChange={(e) => setPartnerData({
                            ...partnerData,
                            birthPlace: e.target.value
                          })}
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
              description="Gezegenlerin geçişlerini ve hayatınıza etkilerini öğrenin."
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
