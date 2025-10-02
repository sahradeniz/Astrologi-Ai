import React, { useEffect, useState } from 'react';
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
  Button,
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { FaStar, FaMoon, FaSun, FaHeart, FaRobot, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { API_URL, JWT_TOKEN_KEY, USER_ID_KEY } from '../config';

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
  const navigate = useNavigate();
  const toast = useToast();
  const [userData, setUserData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY);
    const token = localStorage.getItem(JWT_TOKEN_KEY);

    if (!userId || !token) {
      setUserData(null);
      setFriends([]);
      return;
    }

    const fetchOverview = async () => {
      try {
        setIsLoading(true);
        const headers = {
          'Authorization': `Bearer ${token}`,
        };

        const [userResponse, friendsResponse] = await Promise.all([
          fetch(`${API_URL}/api/user/${userId}`, { headers }),
          fetch(`${API_URL}/api/friends/${userId}`, { headers }),
        ]);

        if (userResponse.status === 401) {
          localStorage.removeItem(JWT_TOKEN_KEY);
          localStorage.removeItem(USER_ID_KEY);
          navigate('/login');
          return;
        }

        if (!userResponse.ok) {
          throw new Error('Kullanıcı bilgileri alınamadı');
        }

        const userJson = await userResponse.json();
        setUserData(userJson);

        if (friendsResponse.ok) {
          const friendsJson = await friendsResponse.json();
          setFriends(friendsJson.friends?.slice(0, 3) || []);
        } else {
          setFriends([]);
        }
      } catch (error) {
        console.error('Home overview error:', error);
        toast({
          title: 'Veri alınamadı',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, [navigate, toast]);

  const handleSynastryClick = () => {
    const userId = localStorage.getItem(USER_ID_KEY);
    const birthDate = userData?.birthDate || localStorage.getItem('birthDate');
    const birthTime = userData?.birthTime || localStorage.getItem('birthTime');
    const birthPlace = userData?.birthPlace || localStorage.getItem('birthPlace');

    if (!userId) {
      toast({
        title: "Giriş Yapın",
        description: "Uyum analizi için lütfen giriş yapın",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    if (!birthDate || !birthTime || !birthPlace) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen profil sayfanızdan doğum bilgilerinizi ekleyin",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate('/profile');
      return;
    }

    navigate('/synastry/form');
  };

  const startSynastryAnalysis = (friendId) => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId || !friendId) {
      return;
    }
    navigate(`/synastry?person1=${userId}&person2=${friendId}`);
  };

  const features = [
    {
      icon: FaRobot,
      title: "Astroloji AI Sohbet",
      description: "Yapay zeka destekli astroloji danışmanınız ile sohbet edin",
      onClick: () => navigate('/chat')
    },
    {
      icon: FaStar,
      title: "Doğum Haritası Analizi",
      description: "Detaylı doğum haritanızı görüntüleyin ve yorumlayın",
      onClick: () => navigate('/character')
    },
    {
      icon: FaHeart,
      title: "İlişki Uyumu (Synastry)",
      description: "İki kişi arasındaki astrolojik uyumu analiz edin",
      onClick: handleSynastryClick
    },
    {
      icon: FaMoon,
      title: "Transit Analizi",
      description: "Güncel gezegen konumlarının etkilerini öğrenin",
      onClick: () => navigate('/transit')
    }
  ];

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" mb={8}>
          <Heading
            as="h1"
            size="xl"
            mb={4}
            bgGradient="linear(to-r, purple.400, pink.400)"
            bgClip="text"
          >
            Astrologi AI
          </Heading>
          <Text fontSize="lg" color={textColor}>
            Yapay zeka destekli modern astroloji platformu
          </Text>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <Spinner size="lg" color="purple.500" />
          </Box>
        ) : userData ? (
          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align="center">
              <VStack align="start" spacing={1} flex={1}>
                <Heading size="md">Hoş geldin, {userData.name || 'Astrolojisever'}!</Heading>
                <Text color="gray.600">{userData.email}</Text>
                {(userData.birthDate || userData.birthTime || userData.birthPlace) && (
                  <Text color="gray.600">
                    Doğum Bilgileri: {userData.birthDate || '-'} · {userData.birthTime || '-'} · {userData.birthPlace || '-'}
                  </Text>
                )}
              </VStack>
              {friends.length > 0 && (
                <Box flex={1} width="100%">
                  <Heading size="sm" mb={3}>Son Eklenen Arkadaşlar</Heading>
                  <VStack align="start" spacing={2}>
                    {friends.map((friend) => (
                      <HStack key={friend._id} spacing={3} width="100%">
                        <Avatar size="sm" name={friend.name} />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="medium">{friend.name}</Text>
                          <Text fontSize="sm" color="gray.500">{friend.birthDate} · {friend.birthPlace}</Text>
                        </VStack>
                        <Button size="sm" variant="outline" colorScheme="purple" onClick={() => startSynastryAnalysis(friend._id)}>
                          Uyum Analizi
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </Stack>
          </Box>
        ) : null}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {features.map((feature, index) => (
            <MotionBox
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </MotionBox>
          ))}
        </SimpleGrid>

        <Box mt={12}>
          <Heading size="lg" mb={6} textAlign="center">
            Son Analizleriniz
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {/* Recent analyses will be mapped here */}
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
};

export default HomePage;
