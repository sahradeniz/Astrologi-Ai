import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  useColorModeValue,
  Container,
  Icon,
  HStack,
  Text,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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
    
    // Redirect to login page
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
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
          <Heading size="xl" textAlign="center">Ayarlar</Heading>
          
          <Divider />
          
          <Button
            leftIcon={<Icon as={FaUser} />}
            variant="ghost"
            justifyContent="flex-start"
            size="lg"
            onClick={handleEditProfile}
          >
            <HStack spacing={4}>
              <Text>Profili Düzenle</Text>
            </HStack>
          </Button>

          <Button
            leftIcon={<Icon as={FaSignOutAlt} />}
            variant="ghost"
            justifyContent="flex-start"
            size="lg"
            colorScheme="red"
            onClick={handleLogout}
          >
            <HStack spacing={4}>
              <Text>Çıkış Yap</Text>
            </HStack>
          </Button>
        </VStack>
      </Box>
    </Container>
  );
};

export default SettingsPage;
