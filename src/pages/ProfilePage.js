import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { FaStar, FaCrown, FaRegBookmark, FaChevronRight, FaUserPlus, FaCog } from 'react-icons/fa';
import FriendsList from '../components/FriendsList';
import AddFriendForm from '../components/AddFriendForm';

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
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const { isOpen: isAddFriendOpen, onOpen: onAddFriendOpen, onClose: onAddFriendClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [userData, setUserData] = useState({
    name: localStorage.getItem('userName') || '',
    birthDate: localStorage.getItem('userBirthDate') || '',
    birthTime: localStorage.getItem('userBirthTime') || '',
    birthPlace: localStorage.getItem('userBirthPlace') || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleUpdateProfile = async () => {
    if (!userData.name || !userData.birthDate) {
      toast({
        title: "Eksik Bilgi",
        description: "İsim ve doğum tarihi zorunludur",
        status: "error",
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5003/api/user/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Profil güncellenirken bir hata oluştu');
      }

      const data = await response.json();
      
      // Update localStorage
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userBirthDate', userData.birthDate);
      localStorage.setItem('userBirthTime', userData.birthTime);
      localStorage.setItem('userBirthPlace', userData.birthPlace);

      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi",
        status: "success",
        duration: 3000
      });

      onSettingsClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: error.message,
        status: "error",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" pt={8} pb={20}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          {/* Profile Header */}
          <VStack spacing={4} align="center" w="full">
            <HStack w="full" justify="flex-end">
              <IconButton
                icon={<FaCog />}
                aria-label="Settings"
                variant="ghost"
                onClick={onSettingsOpen}
              />
            </HStack>
            <Image
              src={`https://ui-avatars.com/api/?name=${userData.name}&background=7928CA&color=fff`}
              alt="Profile"
              borderRadius="full"
              boxSize="150px"
              objectFit="cover"
              fallback={
                <Box
                  width="150px"
                  height="150px"
                  borderRadius="full"
                  bg="purple.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="4xl" color="white">
                    {userData.name ? userData.name[0].toUpperCase() : 'U'}
                  </Text>
                </Box>
              }
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
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  placeholder="Adınız"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Doğum Tarihi</FormLabel>
                <Input
                  type="date"
                  value={userData.birthDate}
                  onChange={(e) => setUserData({ ...userData, birthDate: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Doğum Saati</FormLabel>
                <Input
                  type="time"
                  value={userData.birthTime}
                  onChange={(e) => setUserData({ ...userData, birthTime: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Doğum Yeri</FormLabel>
                <Input
                  value={userData.birthPlace}
                  onChange={(e) => setUserData({ ...userData, birthPlace: e.target.value })}
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
              onClick={handleUpdateProfile}
              isLoading={isLoading}
            >
              Kaydet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AddFriendForm isOpen={isAddFriendOpen} onClose={onAddFriendClose} />
    </Box>
  );
};

export default ProfilePage;
