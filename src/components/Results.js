import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Box, Text, VStack } from "@chakra-ui/react";

const Result = ({ result }) => {
  const navigate = useNavigate();

  const handleNavigate = (page) => {
    if (!result) {
      navigate("/");
      return;
    }
    navigate(`/${page}`, { state: { result } });
  };

  // Handle case where result is null or invalid
  if (!result || !result.planet_positions || !Array.isArray(result.planet_positions) || result.planet_positions.length === 0) {
    return (
      <Box textAlign="center" mt={10}>
        <Text fontSize="lg" color="red.500" fontWeight="bold">
          Lütfen önce bilgilerinizi girin.
        </Text>
        <Button mt={4} colorScheme="blue" onClick={() => navigate("/")}>
          Ana Sayfaya Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="600px" mx="auto" textAlign="center">
      <Text fontSize="2xl" fontWeight="bold" mb={6}>
        Analiz Sonuçları
      </Text>
      <VStack spacing={4}>
        <Button
          colorScheme="teal"
          onClick={() => handleNavigate("character")}
          w="full"
        >
          Karakter Özellikleri
        </Button>
        <Button
          colorScheme="cyan"
          onClick={() => handleNavigate("transit")}
          w="full"
        >
          Günlük Transitler
        </Button>
        <Button
          colorScheme="purple"
          onClick={() => handleNavigate("synastry")}
          w="full"
        >
          Sinastiri Analizi
        </Button>
        <Button
          colorScheme="orange"
          onClick={() => handleNavigate("life-purpose")}
          w="full"
        >
          Hayat Amacı
        </Button>
      </VStack>
    </Box>
  );
};

export default Result;
