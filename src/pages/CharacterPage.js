import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Flex,
  Icon,
  Stack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Heading,
  Button,
  VStack,
  Container,
  SimpleGrid,
  Grid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast
} from '@chakra-ui/react';
import { FaSun, FaMoon, FaMars, FaVenus, FaMercury, FaStar, FaGem } from 'react-icons/fa';
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
    case 'saturn': return FaGem;
    default: return FaStar;
  }
};

const PlanetCard = ({ planet, data }) => {
  if (!data || typeof data !== 'object') {
    console.error(`Invalid planet data for ${planet}:`, data);
    return null;
  }

  // Ensure we have all required fields
  if (!data.zodiac_sign || typeof data.degree !== 'number' || typeof data.minutes !== 'number') {
    console.error(`Missing required fields for ${planet}:`, data);
    return null;
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
      <Text fontWeight="bold" mb={2}>
        {data.name_tr || planet}
      </Text>
      <Text>
        {data.zodiac_sign} {data.degree}°{data.minutes}'
      </Text>
      {data.house && (
        <Text color="gray.600" mt={1}>
          Ev {data.house}
        </Text>
      )}
    </Box>
  );
};

const AspectCard = ({ planet1, planet2, aspects }) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
      <Text fontWeight="bold" mb={2}>
        {planet1} - {planet2}
      </Text>
      {aspects.map((aspect, index) => (
        <Box key={index} mt={2}>
          <Text>
            {aspect.type} ({Math.round(aspect.angle)}°)
          </Text>
          {aspect.interpretation && (
            <Text fontSize="sm" color="gray.600" mt={1}>
              {aspect.interpretation}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
};

const CharacterPage = ({ initialData }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();

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
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center" mb={6}>
          Doğum Haritası
        </Heading>

        <Box>
          <Heading size="md" mb={4}>
            Gezegen Konumları
          </Heading>
          <SimpleGrid columns={[2, 3, 4]} spacing={4}>
            {sortedPlanets.map(([planet, data]) => (
              <PlanetCard key={planet} planet={planet} data={data} />
            ))}
          </SimpleGrid>
        </Box>

        {chartData.aspects && Object.keys(chartData.aspects).length > 0 && (
          <Box>
            <Heading size="md" mb={4}>
              Açılar
            </Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {Object.entries(chartData.aspects).map(([planet1, aspects]) =>
                Object.entries(aspects).map(([planet2, aspectList]) => (
                  <AspectCard
                    key={`${planet1}-${planet2}`}
                    planet1={planet1}
                    planet2={planet2}
                    aspects={aspectList}
                  />
                ))
              )}
            </SimpleGrid>
          </Box>
        )}

        <Box>
          <Heading size="md" mb={4}>
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
  );
};

export default CharacterPage;
