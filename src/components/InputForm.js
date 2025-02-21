import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Container,
  Heading,
  Text,
  useToast,
  useColorModeValue,
  FormErrorMessage,
  InputGroup,
  InputLeftElement,
  Icon,
} from "@chakra-ui/react";
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUser } from "react-icons/fa";

const API_URL = 'http://localhost:5003';

const InputForm = ({ setResult }) => {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "İsim gerekli";
    if (!formData.birthDate) newErrors.birthDate = "Doğum tarihi gerekli";
    if (!formData.birthTime) newErrors.birthTime = "Doğum saati gerekli";
    if (!formData.birthPlace) newErrors.birthPlace = "Doğum yeri gerekli";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/calculate_natal_chart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Sunucu hatası");
      }

      const data = await response.json();
      
      // Save to natal chart data
      localStorage.setItem("natalChartData", JSON.stringify({ ...data, ...formData }));
      
      // Add to friends list if not exists
      const friends = JSON.parse(localStorage.getItem('friends') || '[]');
      const existingFriend = friends.find(
        friend => 
          friend.birthDate === formData.birthDate && 
          friend.birthTime === formData.birthTime &&
          friend.birthPlace === formData.birthPlace
      );
      
      if (!existingFriend) {
        friends.push(formData);
        localStorage.setItem('friends', JSON.stringify(friends));
        
        toast({
          title: "Kişi kaydedildi",
          description: "Kişi listenize eklendi",
          status: "success",
          duration: 3000,
        });
      }
      
      setResult(data);
      navigate("/character");
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Hata",
        description: "Doğum haritası hesaplanırken bir hata oluştu.",
        status: "error",
        duration: 5000,
        isClosable: true,
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
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="xl" mb={2}>
              Doğum Haritası
            </Heading>
            <Text color="gray.600">
              Doğum bilgilerinizi girerek kişisel astroloji haritanızı görüntüleyin
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={errors.name}>
                <FormLabel>İsim</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaUser} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="İsminizi girin"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.birthDate}>
                <FormLabel>Doğum Tarihi</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaCalendar} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.birthDate}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.birthTime}>
                <FormLabel>Doğum Saati</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaClock} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="time"
                    value={formData.birthTime}
                    onChange={(e) =>
                      setFormData({ ...formData, birthTime: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.birthTime}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.birthPlace}>
                <FormLabel>Doğum Yeri</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaMapMarkerAlt} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Şehir, Ülke"
                    value={formData.birthPlace}
                    onChange={(e) =>
                      setFormData({ ...formData, birthPlace: e.target.value })
                    }
                    pl={10}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.birthPlace}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                width="full"
                isLoading={isLoading}
                loadingText="Hesaplanıyor..."
                mt={6}
              >
                Haritayı Hesapla
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default InputForm;
