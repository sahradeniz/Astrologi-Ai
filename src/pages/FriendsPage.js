import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Card,
  CardBody,
  Stack,
  StackDivider,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Container,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { API_URL, JWT_TOKEN_KEY, USER_ID_KEY } from '../config';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newFriend, setNewFriend] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });
  const toast = useToast();
  const navigate = useNavigate();

  const fetchFriends = async () => {
    try {
      const userId = localStorage.getItem(USER_ID_KEY);
      const token = localStorage.getItem(JWT_TOKEN_KEY);
      if (!userId || !token) {
        navigate('/login');
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      const response = await fetch(`${API_URL}/api/friends/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(JWT_TOKEN_KEY);
          localStorage.removeItem(USER_ID_KEY);
          navigate('/login');
        }
        throw new Error(data.error || 'Arkadaş listesi alınamadı');
      }

      setFriends(Array.isArray(data.friends) ? data.friends : []);
    } catch (err) {
      console.error('Error fetching friends:', err);
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

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFriend(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddFriend = async () => {
    try {
      const userId = localStorage.getItem(USER_ID_KEY);
      const token = localStorage.getItem(JWT_TOKEN_KEY);
      if (!userId || !token) {
        navigate('/login');
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      if (!newFriend.name || !newFriend.birthDate) {
        throw new Error('İsim ve doğum tarihi zorunludur');
      }

      const response = await fetch(`${API_URL}/api/friends/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newFriend),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(JWT_TOKEN_KEY);
          localStorage.removeItem(USER_ID_KEY);
          navigate('/login');
        }
        throw new Error(data.error || 'Arkadaş eklenemedi');
      }

      toast({
        title: 'Başarılı',
        description: 'Arkadaş başarıyla eklendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchFriends();
      setNewFriend({ name: '', birthDate: '', birthTime: '', birthPlace: '' });
    } catch (err) {
      console.error('Error adding friend:', err);
      toast({
        title: 'Hata',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.sm" py={10}>
        <Text>Yükleniyor...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.sm" py={10}>
        <Text color="red.500">{error}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Arkadaşlarım</Heading>
        
        <Button colorScheme="purple" onClick={onOpen}>
          Yeni Arkadaş Ekle
        </Button>

        {friends.length === 0 ? (
          <Card>
            <CardBody>
              <Text>Henüz arkadaş eklenmemiş</Text>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <Stack divider={<StackDivider />} spacing={4}>
                {friends.map((friend, index) => (
                  <Box key={friend._id || index}>
                    <Heading size="xs" textTransform="uppercase">
                      {friend.name}
                    </Heading>
                    <Text pt={2} fontSize="sm">
                      Doğum Tarihi: {friend.birthDate ? new Date(friend.birthDate).toLocaleDateString() : 'Belirtilmemiş'}
                    </Text>
                    {friend.birthTime && (
                      <Text fontSize="sm">Doğum Saati: {friend.birthTime}</Text>
                    )}
                    {friend.birthPlace && (
                      <Text fontSize="sm">Doğum Yeri: {friend.birthPlace}</Text>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardBody>
          </Card>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yeni Arkadaş Ekle</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired>
              <FormLabel>İsim</FormLabel>
              <Input
                name="name"
                value={newFriend.name}
                onChange={handleInputChange}
                placeholder="Arkadaşınızın adını girin"
              />
            </FormControl>

            <FormControl mt={4} isRequired>
              <FormLabel>Doğum Tarihi</FormLabel>
              <Input
                name="birthDate"
                type="date"
                value={newFriend.birthDate}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Doğum Saati</FormLabel>
              <Input
                name="birthTime"
                type="time"
                value={newFriend.birthTime}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Doğum Yeri</FormLabel>
              <Input
                name="birthPlace"
                value={newFriend.birthPlace}
                onChange={handleInputChange}
                placeholder="Doğum yerini girin"
              />
            </FormControl>

            <Button
              colorScheme="purple"
              mr={3}
              mt={6}
              onClick={handleAddFriend}
              isDisabled={!newFriend.name || !newFriend.birthDate}
            >
              Ekle
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default FriendsPage;
