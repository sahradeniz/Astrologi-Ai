import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  HStack,
  IconButton,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5003';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu');
      }

      // Store user data
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userName', data.name || formData.name);

      toast({
        title: isLogin ? 'Giriş başarılı!' : 'Kayıt başarılı!',
        status: 'success',
        duration: 3000,
      });

      // Redirect to input page if no natal chart data
      const hasNatalData = localStorage.getItem('natalChartData');
      navigate(hasNatalData ? '/' : '/input');

    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
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
        <VStack spacing={6}>
          <Heading size="xl">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </Heading>
          
          <Text color="gray.600">
            {isLogin 
              ? 'Hesabınıza giriş yapın'
              : 'Yeni bir hesap oluşturun'
            }
          </Text>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={4} width="full">
              {!isLogin && (
                <FormControl isRequired>
                  <FormLabel>İsim</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <FaUser color="gray.500" />
                    </InputLeftElement>
                    <Input
                      type="text"
                      placeholder="İsminizi girin"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </InputGroup>
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FaEnvelope color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    placeholder="Email adresinizi girin"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Şifre</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FaLock color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="password"
                    placeholder="Şifrenizi girin"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                width="full"
                mt={6}
                isLoading={isLoading}
              >
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </Button>
            </Stack>
          </form>

          <HStack pt={4}>
            <Text>
              {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}
            </Text>
            <Button
              variant="link"
              color="purple.500"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Container>
  );
};

export default LoginPage;
