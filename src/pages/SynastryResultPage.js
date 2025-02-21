import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  HStack,
  Avatar,
  Icon,
  Progress,
  Divider,
  Badge,
  Button,
} from '@chakra-ui/react';
import { FaHeart, FaSun, FaMoon, FaArrowRight } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';

const CompatibilityScore = ({ score, label }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  return (
    <Box width="full">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="bold" color={`${getScoreColor(score)}.500`}>
          {score}%
        </Text>
      </HStack>
      <Progress
        value={score}
        colorScheme={getScoreColor(score)}
        borderRadius="full"
        size="sm"
      />
    </Box>
  );
};

const AspectCard = ({ aspect }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
    >
      <VStack align="start" spacing={3}>
        <HStack spacing={2}>
          <Text fontWeight="bold">{aspect.planet1}</Text>
          <Icon as={FaArrowRight} color="purple.500" />
          <Text fontWeight="bold">{aspect.planet2}</Text>
          <Badge colorScheme={aspect.nature === 'harmonious' ? 'green' : 'red'}>
            {aspect.angle}°
          </Badge>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {aspect.interpretation}
        </Text>
      </VStack>
    </Box>
  );
};

const SynastryResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const synastryData = location.state?.result;

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');

  if (!synastryData) {
    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={4}>
          <Text>Uyum analizi verisi bulunamadı.</Text>
          <Button colorScheme="purple" onClick={() => navigate('/synastry')}>
            Yeni Analiz Yap
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          {/* Header */}
          <Box textAlign="center">
            <Icon as={FaHeart} boxSize={10} color="red.500" mb={4} />
            <Heading size="xl" mb={2}>
              Uyum Analizi Sonucu
            </Heading>
            <Text color="gray.600">
              Astrolojik uyumunuzun detaylı analizi
            </Text>
          </Box>

          {/* Partners Info */}
          <HStack
            spacing={4}
            p={6}
            bg={cardBg}
            borderRadius="xl"
            shadow="md"
            width="full"
          >
            <VStack>
              <Avatar size="lg" name={synastryData.person1?.name || 'Kişi 1'} />
              <Text fontWeight="bold">{synastryData.person1?.name || 'Kişi 1'}</Text>
            </VStack>
            <VStack align="center" flex={1}>
              <Icon as={FaHeart} color="red.500" />
              <Text fontSize="lg" fontWeight="bold">
                {Math.round(synastryData.overallCompatibility)}% Uyum
              </Text>
            </VStack>
            <VStack>
              <Avatar size="lg" name={synastryData.person2?.name || 'Kişi 2'} />
              <Text fontWeight="bold">{synastryData.person2?.name || 'Kişi 2'}</Text>
            </VStack>
          </HStack>

          {/* Compatibility Scores */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} width="full">
            <Box p={6} bg={cardBg} borderRadius="xl" shadow="md">
              <VStack spacing={4}>
                <Heading size="md">Temel Uyum Skorları</Heading>
                <CompatibilityScore
                  score={synastryData.emotionalCompatibility}
                  label="Duygusal Uyum"
                />
                <CompatibilityScore
                  score={synastryData.intellectualCompatibility}
                  label="Zihinsel Uyum"
                />
                <CompatibilityScore
                  score={synastryData.physicalCompatibility}
                  label="Fiziksel Uyum"
                />
                <CompatibilityScore
                  score={synastryData.spiritualCompatibility}
                  label="Ruhsal Uyum"
                />
              </VStack>
            </Box>

            <Box p={6} bg={cardBg} borderRadius="xl" shadow="md">
              <VStack spacing={4}>
                <Heading size="md">Element Uyumu</Heading>
                <CompatibilityScore
                  score={synastryData.elementalCompatibility.fire}
                  label="Ateş Elementi"
                />
                <CompatibilityScore
                  score={synastryData.elementalCompatibility.earth}
                  label="Toprak Elementi"
                />
                <CompatibilityScore
                  score={synastryData.elementalCompatibility.air}
                  label="Hava Elementi"
                />
                <CompatibilityScore
                  score={synastryData.elementalCompatibility.water}
                  label="Su Elementi"
                />
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Aspects */}
          <Box width="full">
            <Heading size="md" mb={6}>
              Önemli Açılar
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {synastryData.aspects.map((aspect, index) => (
                <AspectCard key={index} aspect={aspect} />
              ))}
            </SimpleGrid>
          </Box>

          {/* General Interpretation */}
          <Box p={6} bg={cardBg} borderRadius="xl" shadow="md" width="full">
            <VStack spacing={4}>
              <Heading size="md">Genel Yorum</Heading>
              <Text>{synastryData.generalInterpretation}</Text>
            </VStack>
          </Box>

          {/* New Analysis Button */}
          <Button
            colorScheme="purple"
            size="lg"
            onClick={() => navigate('/synastry')}
            leftIcon={<FaHeart />}
          >
            Yeni Analiz Yap
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default SynastryResultPage;
