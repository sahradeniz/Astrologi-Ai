import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Image,
  HStack,
  Icon,
  Button,
  SimpleGrid,
  useColorModeValue,
  Badge,
  useDisclosure,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaStar, FaCrown, FaRegBookmark, FaChevronRight, FaUserPlus, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import FriendsList from '../components/FriendsList';
import AddFriendForm from '../components/AddFriendForm';
import { API_URL, DEFAULT_AVATAR } from '../config';

const ProfileCard = ({ title, value, icon, color }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      shadow="sm"
    >
      <HStack spacing={4}>
        <Icon as={icon} boxSize={6} color={color} />
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="gray.500">
            {title}
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

const SessionCard = ({ number, title, description, duration, image }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      position="relative"
    >
      <Image
        src={image || 'https://via.placeholder.com/400x200'}
        alt={title}
        borderRadius="xl"
        mb={4}
        w="full"
        h="200px"
        objectFit="cover"
      />
      
      <Badge colorScheme="purple" mb={2}>
        #{number}
      </Badge>
      
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      
      <Text color="gray.600" noOfLines={2} mb={4}>
        {description}
      </Text>
      
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="gray.500">
            Süre
          </Text>
          <Text fontWeight="bold">{duration}</Text>
        </VStack>
        
        <Button
          rightIcon={<FaChevronRight />}
          colorScheme="purple"
          variant="ghost"
          size="sm"
        >
          Detaylar
        </Button>
      </HStack>
    </Box>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const { isOpen: isAddFriendOpen, onOpen: onAddFriendOpen, onClose: onAddFriendClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [userData, setUserData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Fetching user data for:', userId);
      const response = await fetch(`${API_URL}/api/user/${userId}`);
      const data = await response.json();

      console.log('User data response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Kullanıcı bilgileri alınamadı');
      }

      setUserData({
        name: data.name || '',
        birthDate: data.birthDate || '',
        birthTime: data.birthTime || '',
        birthPlace: data.birthPlace || ''
      });

      // Update localStorage
      localStorage.setItem('name', data.name || '');
      localStorage.setItem('birthDate', data.birthDate || '');
      localStorage.setItem('birthTime', data.birthTime || '');
      localStorage.setItem('birthPlace', data.birthPlace || '');

    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      const response = await fetch(`${API_URL}/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profil güncellenemedi');
      }

      // Update localStorage
      localStorage.setItem('name', userData.name);
      localStorage.setItem('birthDate', userData.birthDate);
      localStorage.setItem('birthTime', userData.birthTime);
      localStorage.setItem('birthPlace', userData.birthPlace);

      toast({
        title: 'Başarılı',
        description: 'Profil güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error updating profile:', error);
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

  const handleLogout = () => {
    // Clear all user-related data
    localStorage.removeItem('natalChartData');
    localStorage.removeItem('friends');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('selectedPerson1');
    localStorage.removeItem('selectedPerson2');
    
    toast({
      title: "Çıkış yapıldı",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  if (isLoading) {
    return (
      <Container maxW="container.sm" py={10}>
        <Text>Yükleniyor...</Text>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" pt={8} pb={20}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          {/* Profile Header */}
          <VStack spacing={4} align="center" w="full">
            <HStack w="full" justify="flex-end">
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  rightIcon={<Icon as={FaCog} />}
                >
                  Ayarlar
                </MenuButton>
                <MenuList>
                  <MenuItem 
                    icon={<Icon as={FaUser} />}
                    onClick={handleEditProfile}
                  >
                    Profili Düzenle
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={FaSignOutAlt} />}
                    color="red.500"
                    onClick={handleLogout}
                  >
                    Çıkış Yap
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            <Avatar
              size="xl"
              name={userData.name}
              src={DEFAULT_AVATAR}
            />
            <VStack spacing={1}>
              <Heading size="lg">{userData.name}</Heading>
              <Text color="gray.500">@{userData.name.toLowerCase().replace(/\s/g, '_')}</Text>
            </VStack>
            <HStack>
              <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                {userData.birthPlace}
              </Badge>
              <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                {userData.birthDate}
              </Badge>
            </HStack>
          </VStack>

          {/* Stats Grid */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
            <ProfileCard
              title="Yorumlar"
              value="294"
              icon={FaStar}
              color="yellow.500"
            />
            <ProfileCard
              title="Premium"
              value="Aktif"
              icon={FaCrown}
              color="purple.500"
            />
            <ProfileCard
              title="Kaydedilenler"
              value="45"
              icon={FaRegBookmark}
              color="blue.500"
            />
            <ProfileCard
              title="Seviye"
              value="İleri"
              icon={FaStar}
              color="green.500"
            />
          </SimpleGrid>

          {/* Recent Sessions */}
          <VStack align="start" w="full" spacing={4}>
            <Heading size="md">Son Oturumlar</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
              <SessionCard
                number="294"
                title="Astroloji Temelleri"
                description="Temel astroloji kavramları ve gezegen yorumlamaları hakkında kapsamlı bir eğitim."
                duration="2.5 Saat"
                image="/path/to/image.jpg"
              />
              <SessionCard
                number="293"
                title="Ay Düğümleri"
                description="Kuzey ve Güney ay düğümlerinin hayatınızdaki karmanız üzerindeki etkisi."
                duration="1.5 Saat"
                image="/path/to/image.jpg"
              />
            </SimpleGrid>
          </VStack>

          {/* Friends List */}
          <VStack align="start" w="full" spacing={4}>
            <HStack justify="space-between" w="full">
              <Heading size="md">Arkadaşlarım</Heading>
              <Button
                leftIcon={<FaUserPlus />}
                colorScheme="purple"
                variant="ghost"
                size="sm"
                onClick={onAddFriendOpen}
              >
                Arkadaş Ekle
              </Button>
            </HStack>
            <Box w="full">
              <FriendsList />
            </Box>
          </VStack>
        </VStack>
      </Container>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Profil Ayarları</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>İsim</FormLabel>
                <Input
                  value={userData.name}
                  onChange={handleInputChange}
                  placeholder="Adınız"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Doğum Tarihi</FormLabel>
                <Input
                  type="date"
                  value={userData.birthDate}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Doğum Saati</FormLabel>
                <Input
                  type="time"
                  value={userData.birthTime}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Doğum Yeri</FormLabel>
                <Input
                  value={userData.birthPlace}
                  onChange={handleInputChange}
                  placeholder="Şehir, Ülke"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSettingsClose}>
              İptal
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Kaydet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {error ? (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Hata!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <AddFriendForm isOpen={isAddFriendOpen} onClose={onAddFriendClose} />
      )}
    </Box>
  );
};

export default ProfilePage;
