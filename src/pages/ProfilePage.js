import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Avatar,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  useToast,
  IconButton,
  Divider,
  useColorMode,
  Switch,
} from '@chakra-ui/react';
import { FaUserPlus, FaHeart, FaUserMinus } from 'react-icons/fa';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });
  const [avatarError, setAvatarError] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchUserData();
    fetchFriends();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Kullanıcı bilgileri alınamadı');
      }

      const data = await response.json();
      setUserData(data);
      setFormData({
        name: data.name || '',
        birthDate: data.birthDate || '',
        birthTime: data.birthTime || '',
        birthPlace: data.birthPlace || '',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchFriends = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Arkadaşlar listesi alınamadı');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        toast({
          title: "Oturum Hatası",
          description: "Lütfen tekrar giriş yapın",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          birth_data: {
            birthDate: formData.birthDate,
            birthTime: formData.birthTime,
            birthPlace: formData.birthPlace,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Profil güncellenemedi');
      }

      const data = await response.json();
      setUserData(data);
      setIsEditing(false);

      toast({
        title: 'Başarılı',
        description: 'Profil güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh user data
      await fetchUserData();
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

  const handleAddFriend = () => {
    navigate('/friends/add');
  };

  const startSynastryAnalysis = (friendId) => {
    const userId = localStorage.getItem('userId');
    if (userId && friendId) {
      navigate(`/synastry?person1=${userId}&person2=${friendId}`);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/friends/${userId}/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Arkadaş silinemedi');
      }

      // Refresh friends list
      await fetchFriends();

      toast({
        title: 'Başarılı',
        description: 'Arkadaş silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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

  const renderFriendsList = () => {
    if (friends.length === 0) {
      return (
        <Text color="gray.500" p={4}>
          Henüz arkadaş eklenmemiş
        </Text>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} w="100%">
        {friends.map((friend) => (
          <Card key={friend._id} bg={bgColor} shadow="md">
            <CardBody>
              <VStack spacing={3} align="start">
                <HStack justify="space-between" w="100%" align="center">
                  <Avatar
                    name={friend.name}
                    size="sm"
                    bg={avatarError ? "purple.500" : undefined}
                    onError={handleImageError}
                  >
                    {getInitials(friend.name)}
                  </Avatar>
                  <Text fontWeight="bold" isTruncated maxW="70%">
                    {friend.name}
                  </Text>
                </HStack>
                <VStack spacing={1} align="start" w="100%">
                  <Text fontSize="sm" color="gray.600">
                    <Text as="span" fontWeight="medium">Doğum:</Text> {friend.birthDate}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    <Text as="span" fontWeight="medium">Saat:</Text> {friend.birthTime}
                  </Text>
                  <Text fontSize="sm" color="gray.600" isTruncated>
                    <Text as="span" fontWeight="medium">Yer:</Text> {friend.birthPlace}
                  </Text>
                </VStack>
                <HStack spacing={2} w="100%" justify="flex-end">
                  <Button
                    leftIcon={<FaHeart />}
                    colorScheme="purple"
                    size="sm"
                    onClick={() => startSynastryAnalysis(friend._id)}
                  >
                    Uyum Analizi
                  </Button>
                  <IconButton
                    icon={<FaUserMinus />}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    aria-label="Arkadaşı Sil"
                    onClick={() => handleRemoveFriend(friend._id)}
                  />
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  if (isLoading) {
    return (
      <Container maxW="container.sm" py={10}>
        <Text>Yükleniyor...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header with user info */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">{userData?.name || 'Kullanıcı'}</Heading>
            <Text color="gray.500">{userData?.email}</Text>
          </VStack>
          <Avatar
            size="xl"
            name={userData?.name}
            src={userData?.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
          />
        </HStack>

        <Tabs variant="enclosed" colorScheme="purple">
          <TabList>
            <Tab>Profil Bilgileri</Tab>
            <Tab>Arkadaşlarım</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Card bg={bgColor}>
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Kişisel Bilgiler</Heading>
                      <Button
                        colorScheme="purple"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? 'İptal' : 'Düzenle'}
                      </Button>
                    </HStack>

                    {isEditing ? (
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel>İsim</FormLabel>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Doğum Tarihi</FormLabel>
                          <Input
                            name="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={handleInputChange}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Doğum Saati</FormLabel>
                          <Input
                            name="birthTime"
                            type="time"
                            value={formData.birthTime}
                            onChange={handleInputChange}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Doğum Yeri</FormLabel>
                          <Input
                            name="birthPlace"
                            value={formData.birthPlace}
                            onChange={handleInputChange}
                            placeholder="Şehir, Ülke"
                          />
                        </FormControl>

                        <Button
                          colorScheme="purple"
                          onClick={handleSubmit}
                          isLoading={isLoading}
                          width="full"
                        >
                          Kaydet
                        </Button>
                      </VStack>
                    ) : (
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontWeight="bold">İsim</Text>
                          <Text>{userData?.name || '-'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Email</Text>
                          <Text>{userData?.email || '-'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Doğum Tarihi</Text>
                          <Text>{userData?.birthDate || '-'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Doğum Saati</Text>
                          <Text>{userData?.birthTime || '-'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Doğum Yeri</Text>
                          <Text>{userData?.birthPlace || '-'}</Text>
                        </Box>
                      </SimpleGrid>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              {renderFriendsList()}
              {friends.length === 0 && (
                <Box textAlign="center" p={6}>
                  <Button
                    leftIcon={<FaUserPlus />}
                    colorScheme="purple"
                    variant="outline"
                    mt={4}
                    onClick={handleAddFriend}
                  >
                    Arkadaş Ekle
                  </Button>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
        <FormControl display="flex" alignItems="center" justifyContent="space-between">
          <FormLabel htmlFor="color-mode" mb="0">
            Tema Rengi
          </FormLabel>
          <HStack>
            <SunIcon />
            <Switch
              id="color-mode"
              isChecked={colorMode === 'dark'}
              onChange={toggleColorMode}
            />
            <MoonIcon />
          </HStack>
        </FormControl>
      </VStack>
    </Container>
  );
};

export default ProfilePage;
