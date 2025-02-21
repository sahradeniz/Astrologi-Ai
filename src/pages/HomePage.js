import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  useColorModeValue,
  Icon,
  HStack,
  Avatar,
  Spacer,
  Button,
} from '@chakra-ui/react';
import { FaStar, FaMoon, FaSun, FaHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const FeatureCard = ({ icon, title, description }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <MotionBox
      whileHover={{ y: -5 }}
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      shadow="md"
    >
      <VStack spacing={4} align="start">
        <Icon as={icon} boxSize={8} color="purple.500" />
        <Heading size="md">{title}</Heading>
        <Text color="gray.600">{description}</Text>
      </VStack>
    </MotionBox>
  );
};

const HomePage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  return (
    <Box bg={bgColor} minH="100vh" pt={8} pb={20}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          {/* Header */}
          <Box w="full" mb={8}>
            <HStack>
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" color="gray.600">
                  Hoş geldin
                </Text>
                <Heading size="xl" color={textColor}>
                  Astroloji Keşfi
                </Heading>
              </VStack>
              <Spacer />
              <Avatar size="md" name="User" src="https://bit.ly/broken-link" />
            </HStack>
          </Box>

          {/* Featured Section */}
          <Box
            w="full"
            p={6}
            bg="purple.500"
            borderRadius="2xl"
            color="white"
            mb={8}
          >
            <VStack align="start" spacing={4}>
              <Icon as={FaStar} boxSize={10} />
              <Heading size="lg">Günlük Burç Yorumu</Heading>
              <Text>
                Bugün yıldızlar size neler söylüyor? Günlük burç yorumunuzu okuyun
                ve gününüzü planlayın.
              </Text>
              <Button colorScheme="whiteAlpha">Hemen Oku</Button>
            </VStack>
          </Box>

          {/* Features Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
            <FeatureCard
              icon={FaStar}
              title="Natal Harita"
              description="Doğum haritanızı hesaplayın ve detaylı yorumları keşfedin."
            />
            <FeatureCard
              icon={FaMoon}
              title="Ay Fazları"
              description="Ay'ın günlük pozisyonları ve bunların etkileri hakkında bilgi edinin."
            />
            <FeatureCard
              icon={FaSun}
              title="Gezegen Transitler"
              description="Gezegenlerin geçişlerini ve hayatınıza etkilerini öğrenin."
            />
            <FeatureCard
              icon={FaHeart}
              title="Uyum Analizi"
              description="İlişki ve uyum analizleri ile astrolojik uyumunuzu keşfedin."
            />
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default HomePage;
