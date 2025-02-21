import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Image,
  HStack,
  Icon,
  Button,
  SimpleGrid,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { FaStar, FaCrown, FaRegBookmark, FaChevronRight } from 'react-icons/fa';

const ProfileCard = ({ title, value, icon, color }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      shadow="sm"
    >
      <HStack spacing={4}>
        <Icon as={icon} boxSize={6} color={color} />
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="gray.500">
            {title}
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

const SessionCard = ({ number, title, description, cost, duration, image }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      position="relative"
    >
      <Image
        src={image || 'https://via.placeholder.com/400x200'}
        alt={title}
        borderRadius="xl"
        mb={4}
        w="full"
        h="200px"
        objectFit="cover"
      />
      
      <Badge colorScheme="purple" mb={2}>
        #{number}
      </Badge>
      
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      
      <Text color="gray.600" noOfLines={2} mb={4}>
        {description}
      </Text>
      
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="gray.500">
            Süre
          </Text>
          <Text fontWeight="bold">{duration}</Text>
        </VStack>
        
        <Button
          rightIcon={<FaChevronRight />}
          colorScheme="purple"
          variant="ghost"
          size="sm"
        >
          Detaylar
        </Button>
      </HStack>
    </Box>
  );
};

const ProfilePage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box bg={bgColor} minH="100vh" pt={8} pb={20}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          {/* Profile Header */}
          <VStack spacing={4} align="center" w="full">
            <Image
              src="https://via.placeholder.com/150"
              alt="Profile"
              borderRadius="full"
              boxSize="150px"
              objectFit="cover"
            />
            <VStack spacing={1}>
              <Heading size="lg">Astroloji Meraklısı</Heading>
              <Text color="gray.500">@astro_lover</Text>
            </VStack>
            <Button colorScheme="purple" size="sm">
              Profili Düzenle
            </Button>
          </VStack>

          {/* Stats Grid */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
            <ProfileCard
              title="Yorumlar"
              value="294"
              icon={FaStar}
              color="yellow.500"
            />
            <ProfileCard
              title="Premium"
              value="Aktif"
              icon={FaCrown}
              color="purple.500"
            />
            <ProfileCard
              title="Kaydedilenler"
              value="45"
              icon={FaRegBookmark}
              color="blue.500"
            />
            <ProfileCard
              title="Seviye"
              value="İleri"
              icon={FaStar}
              color="green.500"
            />
          </SimpleGrid>

          {/* Recent Sessions */}
          <VStack align="start" w="full" spacing={4}>
            <Heading size="md">Son Oturumlar</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
              <SessionCard
                number="294"
                title="Astroloji Temelleri"
                description="Temel astroloji kavramları ve gezegen yorumlamaları hakkında kapsamlı bir eğitim."
                duration="2.5 Saat"
                image="/path/to/image.jpg"
              />
              <SessionCard
                number="293"
                title="Ay Düğümleri"
                description="Kuzey ve Güney ay düğümlerinin hayatınızdaki karmanız üzerindeki etkisi."
                duration="1.5 Saat"
                image="/path/to/image.jpg"
              />
            </SimpleGrid>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default ProfilePage;
