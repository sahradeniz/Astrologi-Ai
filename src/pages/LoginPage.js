import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link as ChakraLink,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  HStack,
  IconButton,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Switch,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş yapılamadı');
      }

      // Save user data and token
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('name', data.name);
      localStorage.setItem('email', data.email);
      
      // Optional birth info
      if (data.birthDate) localStorage.setItem('birthDate', data.birthDate);
      if (data.birthTime) localStorage.setItem('birthTime', data.birthTime);
      if (data.birthPlace) localStorage.setItem('birthPlace', data.birthPlace);

      toast({
        title: 'Başarılı',
        description: 'Giriş yapıldı',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      // Save user data to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.name || 'User');
      
      console.log('Saved to localStorage:', {
        userId: data.userId,
        userEmail: data.email,
        userName: data.name
      });

      toast({
        title: "Kayıt başarılı!",
        status: "success",
        duration: 3000,
      });

      // Always navigate to home page after successful login/register
      navigate('/');

    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
      toast({
        title: "Hata",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = isLogin ? handleLogin : handleRegister;

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
          
          <Text color={textColor}>
            {isLogin 
              ? 'Hesabınıza giriş yapın'
              : 'Yeni bir hesap oluşturun'
            }
          </Text>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={4} width="full">
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FaEnvelope color="gray.500" />
                  </InputLeftElement>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email adresinizi girin"
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
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Şifrenizi girin"
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {!isLogin && (
                <>
                  <FormControl isRequired>
                    <FormLabel>İsim</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <FaUser color="gray.500" />
                      </InputLeftElement>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="İsminizi girin"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Doğum Tarihi</FormLabel>
                    <Input
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Doğum Saati</FormLabel>
                    <Input
                      name="birthTime"
                      type="time"
                      value={formData.birthTime}
                      onChange={handleInputChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Doğum Yeri</FormLabel>
                    <Input
                      name="birthPlace"
                      value={formData.birthPlace}
                      onChange={handleInputChange}
                      placeholder="Doğum yerinizi girin"
                    />
                  </InputGroup>
                </>
              )}

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
            <Switch
              isChecked={!isLogin}
              onChange={() => setIsLogin(!isLogin)}
              colorScheme="purple"
            />
          </HStack>
        </VStack>
      </Box>
    </Container>
  );
};

export default LoginPage;
