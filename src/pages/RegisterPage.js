import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  useToast,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.700');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: 'Hata',
        description: 'Lütfen tüm alanları doldurun',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Hata',
        description: 'Şifreler eşleşmiyor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız oldu');
      }

      toast({
        title: 'Başarılı',
        description: 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/login');

    } catch (error) {
      console.error('Registration error:', error);
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

  return (
    <Container maxW="container.sm" py={8}>
      <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="lg">
        <VStack spacing={6}>
          <Heading>Kayıt Ol</Heading>

          <FormControl isRequired>
            <FormLabel>İsim</FormLabel>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="İsminizi girin"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email adresinizi girin"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Şifre</FormLabel>
            <InputGroup>
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
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Şifre Tekrar</FormLabel>
            <InputGroup>
              <Input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Şifrenizi tekrar girin"
              />
              <InputRightElement>
                <IconButton
                  icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            colorScheme="purple"
            width="full"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Kayıt Ol
          </Button>

          <Text>
            Zaten hesabınız var mı?{' '}
            <Link to="/login" style={{ color: 'purple' }}>
              Giriş yapın
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default RegisterPage;
