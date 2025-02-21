import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useColorModeValue,
  Container,
  useToast,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { FaUser, FaCalendar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const EditProfilePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });

  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const natalData = localStorage.getItem('natalChartData');
    if (natalData) {
      const data = JSON.parse(natalData);
      setFormData({
        name: data.name || '',
        birthDate: data.birthDate || '',
        birthTime: data.birthTime || '',
        birthPlace: data.birthPlace || '',
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Update natalChartData
    const natalData = JSON.parse(localStorage.getItem('natalChartData') || '{}');
    const updatedNatalData = { ...natalData, ...formData };
    localStorage.setItem('natalChartData', JSON.stringify(updatedNatalData));

    // Update in friends list if exists
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    const updatedFriends = friends.map(friend => {
      if (friend.birthDate === natalData.birthDate && 
          friend.birthTime === natalData.birthTime && 
          friend.birthPlace === natalData.birthPlace) {
        return formData;
      }
      return friend;
    });
    localStorage.setItem('friends', JSON.stringify(updatedFriends));

    toast({
      title: "Profil güncellendi",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    navigate('/settings');
  };

  return (
    <Container maxW="container.sm" py={10}>
      <Box
        p={8}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        shadow="xl"
      >
        <VStack spacing={6} align="stretch">
          <Heading size="xl" textAlign="center">Profili Düzenle</Heading>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>İsim</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaUser} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="İsminizi girin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    pl={10}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Doğum Tarihi</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaCalendar} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    pl={10}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Doğum Saati</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaClock} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="time"
                    value={formData.birthTime}
                    onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                    pl={10}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Doğum Yeri</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaMapMarkerAlt} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Şehir, Ülke"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    pl={10}
                  />
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                width="full"
                mt={6}
              >
                Kaydet
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default EditProfilePage;
