import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const boxBg = useColorModeValue('white', 'gray.800');

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen email ve şifrenizi girin",
        status: "error",
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5003/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      // Save user data to localStorage
      localStorage.setItem('userId', data._id);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userBirthDate', data.birthDate);
      localStorage.setItem('userBirthTime', data.birthTime);
      localStorage.setItem('userBirthPlace', data.birthPlace);

      toast({
        title: "Başarılı",
        description: "Giriş yapıldı",
        status: "success",
        duration: 3000
      });

      navigate('/');
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

  const handleRegister = async () => {
    if (!registerData.email || !registerData.password || !registerData.name || !registerData.birthDate) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen gerekli alanları doldurun",
        status: "error",
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5003/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt başarısız');
      }

      toast({
        title: "Başarılı",
        description: "Hesabınız oluşturuldu. Giriş yapabilirsiniz.",
        status: "success",
        duration: 3000
      });

      // Switch to login tab
      document.getElementById('login-tab').click();
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
    <Box bg={bgColor} minH="100vh" py={20}>
      <Container maxW="container.sm">
        <VStack spacing={8}>
          <Heading>Astrologi AI</Heading>
          <Box w="full" bg={boxBg} p={8} borderRadius="xl" shadow="lg">
            <Tabs isFitted variant="enclosed">
              <TabList mb="1em">
                <Tab id="login-tab">Giriş</Tab>
                <Tab>Kayıt Ol</Tab>
              </TabList>
              <TabPanels>
                {/* Login Panel */}
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({
                          ...loginData,
                          email: e.target.value
                        })}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Şifre</FormLabel>
                      <Input
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({
                          ...loginData,
                          password: e.target.value
                        })}
                      />
                    </FormControl>
                    <Button
                      colorScheme="purple"
                      width="full"
                      onClick={handleLogin}
                      isLoading={isLoading}
                    >
                      Giriş Yap
                    </Button>
                  </VStack>
                </TabPanel>

                {/* Register Panel */}
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          email: e.target.value
                        })}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Şifre</FormLabel>
                      <Input
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          password: e.target.value
                        })}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>İsim</FormLabel>
                      <Input
                        value={registerData.name}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          name: e.target.value
                        })}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Doğum Tarihi</FormLabel>
                      <Input
                        type="date"
                        value={registerData.birthDate}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          birthDate: e.target.value
                        })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Doğum Saati</FormLabel>
                      <Input
                        type="time"
                        value={registerData.birthTime}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          birthTime: e.target.value
                        })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Doğum Yeri</FormLabel>
                      <Input
                        value={registerData.birthPlace}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          birthPlace: e.target.value
                        })}
                        placeholder="Şehir, Ülke"
                      />
                    </FormControl>
                    <Button
                      colorScheme="purple"
                      width="full"
                      onClick={handleRegister}
                      isLoading={isLoading}
                    >
                      Kayıt Ol
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default LoginPage;
