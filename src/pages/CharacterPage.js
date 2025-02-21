import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Icon,
  Divider,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Tooltip,
  IconButton,
  Flex,
  Spacer,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast
} from "@chakra-ui/react";
import { FaSun, FaMoon, FaStar, FaArrowRight, FaMars, FaVenus, FaMercury } from "react-icons/fa";
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const PLANET_NAMES = {
  'Sun': 'Güneş',
  'Moon': 'Ay',
  'Mercury': 'Merkür',
  'Venus': 'Venüs',
  'Mars': 'Mars',
  'Jupiter': 'Jüpiter',
  'Saturn': 'Satürn',
  'Uranus': 'Uranüs',
  'Neptune': 'Neptün',
  'Pluto': 'Plüton',
  'North Node': 'Kuzey Ay Düğümü',
  'Chiron': 'Chiron'
};

const ASPECT_NAMES = {
  'Conjunction': 'Kavuşum',
  'Opposition': 'Karşıt',
  'Trine': 'Üçgen',
  'Square': 'Kare',
  'Sextile': 'Altmış'
};

const getPlanetIcon = (planet) => {
  switch (planet.toLowerCase()) {
    case 'sun': return FaSun;
    case 'moon': return FaMoon;
    case 'mars': return FaMars;
    case 'venus': return FaVenus;
    case 'mercury': return FaMercury;
    case 'jupiter': return FaStar;
    case 'saturn': return FaStar;
    default: return FaStar;
  }
};

const PlanetCard = ({ data }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Card
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
    >
      <CardHeader pb={2}>
        <HStack>
          <Icon as={getPlanetIcon(data.planet_name)} color="yellow.400" />
          <Heading size="md">{data.planet_name}</Heading>
          <Spacer />
          <Badge colorScheme="purple">{data.zodiac_sign}</Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        <VStack align="start" spacing={2}>
          <Text fontSize="sm">
            Derece: {data.degree}°{data.minutes}'
          </Text>
          <Text fontSize="sm">Ev: {data.house}</Text>
        </VStack>
      </CardBody>
    </Card>
  );
};

const AspectCard = ({ aspect, interpretation }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
    >
      <CardHeader pb={2}>
        <HStack>
          <Heading size="sm">{aspect.planet1}</Heading>
          <Icon as={FaArrowRight} color="blue.400" />
          <Heading size="sm">{aspect.planet2}</Heading>
          <Spacer />
          <Badge colorScheme="teal">{ASPECT_NAMES[aspect.aspect_type]}</Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        <Box
          fontSize="sm"
          position="relative"
          maxH={isExpanded ? "none" : "100px"}
          overflow="hidden"
          cursor="pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Text>{interpretation || "Yorum yükleniyor..."}</Text>
          {!isExpanded && (
            <Box
              position="absolute"
              bottom="0"
              left="0"
              right="0"
              height="40px"
              background="linear-gradient(transparent, white)"
              pointerEvents="none"
            />
          )}
        </Box>
        <Button
          size="sm"
          variant="ghost"
          width="100%"
          mt={2}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Daha az göster" : "Devamını oku"}
        </Button>
      </CardBody>
    </Card>
  );
};

const CharacterPage = ({ initialData }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.800", "gray.100");

  useEffect(() => {
    const loadData = () => {
      try {
        // First try initialData prop
        let data = initialData;
        
        if (!data && location.state?.result) {
          // Then try location state
          console.log('Loading chart data from location state:', location.state.result);
          data = location.state.result;
        }
        
        if (!data) {
          // Finally try localStorage
          const storedData = localStorage.getItem('natalChart');
          if (storedData) {
            data = JSON.parse(storedData);
            console.log('Loading chart data from localStorage:', data);
          }
        }

        // Validate data structure
        if (!data) {
          throw new Error('No chart data found. Please calculate your natal chart first.');
        }

        if (!data.planet_positions || typeof data.planet_positions !== 'object') {
          throw new Error('Invalid chart data: missing or invalid planet positions');
        }

        // Validate each planet has required fields
        Object.entries(data.planet_positions).forEach(([planet, planetData]) => {
          if (!planetData || typeof planetData !== 'object') {
            throw new Error(`Invalid data for planet ${planet}`);
          }
          if (!planetData.zodiac_sign || typeof planetData.degree === 'undefined' || typeof planetData.minutes === 'undefined') {
            throw new Error(`Missing required fields for planet ${planet}`);
          }
        });

        setChartData(data);
        
      } catch (error) {
        console.error('Error loading chart data:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        navigate('/');
      }
    };

    loadData();
  }, [location, navigate, toast, initialData]);

  if (error) {
    return (
      <Container maxW="container.xl" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (!chartData || !chartData.planet_positions) {
    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={4}>
          <Text>Loading chart data...</Text>
          <Button onClick={() => navigate('/')}>
            Return to Calculator
          </Button>
        </VStack>
      </Container>
    );
  }

  // Debug log
  console.log('Rendering chart data:', chartData);
  console.log('Planet positions:', chartData.planet_positions);

  // Sort planets in traditional order
  const planetOrder = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 
    'Pluto', 'North Node'
  ];

  // Create array of sorted planet entries
  const sortedPlanets = Object.entries(chartData.planet_positions)
    .sort(([a], [b]) => {
      const indexA = planetOrder.indexOf(a);
      const indexB = planetOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

  console.log('Sorted planets:', sortedPlanets);

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" pb={8}>
            <Heading size="2xl" color={textColor} mb={4}>
              Doğum Haritası
            </Heading>
            <Text fontSize="lg" color={textColor}>
              {chartData.name || "Doğum Haritası"} - {chartData.birth_date}
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {sortedPlanets.map(([key, planetData]) => (
              <PlanetCard
                key={key}
                data={{ ...planetData, planet_name: PLANET_NAMES[key] }}
              />
            ))}
          </SimpleGrid>

          <Divider my={8} />

          <Box>
            <Heading size="lg" mb={6} color={textColor}>
              Açı Yorumları
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {chartData.aspects && Object.keys(chartData.aspects).length > 0 && (
                Object.entries(chartData.aspects).map(([planet1, aspects]) =>
                  Object.entries(aspects).map(([planet2, aspectList]) => (
                    aspectList.map((aspect, index) => (
                      <AspectCard
                        key={`${planet1}-${planet2}-${index}`}
                        aspect={aspect}
                        interpretation={aspect.interpretation}
                      />
                    ))
                  ))
                )
              )}
            </SimpleGrid>
          </Box>

          <Box>
            <Heading size="lg" mb={6} color={textColor}>
              Ev Pozisyonları
            </Heading>
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              {chartData.house_positions.map((position, index) => (
                <Box key={index} p={4} borderWidth="1px" borderRadius="lg" bg="white">
                  <Text fontWeight="bold">Ev {index + 1}</Text>
                  <Text>{Math.floor(position)}°{Math.floor((position % 1) * 60)}'</Text>
                </Box>
              ))}
            </Grid>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default CharacterPage;
