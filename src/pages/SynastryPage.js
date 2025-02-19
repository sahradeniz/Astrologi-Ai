import React from 'react';
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
  Heading
} from '@chakra-ui/react';
import { FaSun, FaMoon, FaMars, FaVenus, FaMercury } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const getPlanetIcon = (planet) => {
  switch (planet.toLowerCase()) {
    case 'güneş': return FaSun;
    case 'ay': return FaMoon;
    case 'mars': return FaMars;
    case 'venüs': return FaVenus;
    case 'merkür': return FaMercury;
    case 'jüpiter': return FaSun; // Using sun icon as fallback
    case 'satürn': return FaMoon; // Using moon icon as fallback
    default: return FaSun;
  }
};

const SynastryPage = () => {
  const location = useLocation();
  const { synastry_aspects, person1_positions, person2_positions } = location.state?.result || {};

  const MotionBox = motion(Box);

  if (!synastry_aspects || !person1_positions || !person2_positions) {
    return (
      <Box textAlign="center" mt={10}>
        <Text fontSize="lg" color="red.500">
          Veri bulunamadı. Lütfen sinastri analizi için iki kişinin bilgilerini girin.
        </Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="800px" mx="auto">
      <Heading mb={4}>Sinastri Analizi</Heading>

      {/* Person 1 Planets */}
      <Text fontSize="xl" fontWeight="semibold" mb={4}>
        1. Kişinin Gezegen Pozisyonları
      </Text>
      <Stack spacing={4} mb={6}>
        {person1_positions.map((planet, index) => (
          <MotionBox
            key={index}
            p={4}
            borderRadius="md"
            boxShadow="md"
            bg="white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Icon
                  as={getPlanetIcon(planet.planet)}
                  color="yellow.400"
                  boxSize={6}
                  mr={4}
                />
                <Text fontSize="lg" fontWeight="semibold">
                  {planet.planet}
                </Text>
              </Flex>
              <Text color="gray.500">
                {planet.sign} {planet.degree}°
              </Text>
            </Flex>
          </MotionBox>
        ))}
      </Stack>

      {/* Person 2 Planets */}
      <Text fontSize="xl" fontWeight="semibold" mb={4}>
        2. Kişinin Gezegen Pozisyonları
      </Text>
      <Stack spacing={4} mb={6}>
        {person2_positions.map((planet, index) => (
          <MotionBox
            key={index}
            p={4}
            borderRadius="md"
            boxShadow="md"
            bg="white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Icon
                  as={getPlanetIcon(planet.planet)}
                  color="yellow.400"
                  boxSize={6}
                  mr={4}
                />
                <Text fontSize="lg" fontWeight="semibold">
                  {planet.planet}
                </Text>
              </Flex>
              <Text color="gray.500">
                {planet.sign} {planet.degree}°
              </Text>
            </Flex>
          </MotionBox>
        ))}
      </Stack>

      {/* Synastry Aspects */}
      <Text fontSize="xl" fontWeight="semibold" mb={4}>
        Gezegen Açıları ve Yorumları
      </Text>
      <Accordion allowMultiple>
        {Object.entries(synastry_aspects).map(([aspect, details], index) => (
          <AccordionItem key={index}>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{aspect}</Text>
                  <Text color="gray.500">
                    {details.aspect_type} (Orb: {details.orb})
                  </Text>
                </Flex>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Box p={4}>
                <Text color="gray.700">{details.interpretation}</Text>
              </Box>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};

export default SynastryPage;
