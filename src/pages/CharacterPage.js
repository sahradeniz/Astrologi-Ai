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

const CharacterPage = () => {
  const location = useLocation();
  const { planet_positions, aspects, house_positions } = location.state?.result || {};

  const MotionBox = motion(Box);

  if (!planet_positions) {
    return (
      <Box textAlign="center" mt={10}>
        <Text fontSize="lg" color="red.500">
          Veri bulunamadı. Lütfen doğum bilgilerinizi tekrar girin.
        </Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="800px" mx="auto">
      <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        Karakter Özellikleri
      </Text>

      <Box height="1px" bg="gray.200" my={6} />

      {/* Planets Section */}
      <Text fontSize="xl" fontWeight="semibold" mb={4}>
        Gezegen Pozisyonları ve Yorumları
      </Text>
      <Accordion allowMultiple>
        {planet_positions.map((planet, index) => (
          <AccordionItem key={index}>
            <AccordionButton>
              <MotionBox
                p={4}
                w="full"
                borderRadius="md"
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
                    {planet.sign} {planet.degree}°, {planet.house}. evde
                  </Text>
                </Flex>
              </MotionBox>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Box p={4}>
                <Text color="gray.700">{planet.interpretation}</Text>
              </Box>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      <Box height="1px" bg="gray.200" my={6} />

      {/* Aspects Section */}
      <Text fontSize="xl" fontWeight="semibold" mb={4}>
        Açılar ve Yorumları
      </Text>
      <Accordion allowMultiple>
        {Object.entries(aspects).map(([aspect, details], index) => (
          <AccordionItem key={index}>
            <AccordionButton>
              <MotionBox
                p={4}
                w="full"
                borderRadius="md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{aspect}</Text>
                  <Text color="gray.500">
                    {details.aspect_type} (Orb: {details.orb})
                  </Text>
                </Flex>
              </MotionBox>
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

      <Box height="1px" bg="gray.200" my={6} />

      {/* Houses Section */}
      <Text fontSize="xl" fontWeight="semibold" mb={4}>
        Evler
      </Text>
      <Stack spacing={4}>
        {house_positions && Object.entries(house_positions).map(([house, details], index) => (
          <MotionBox
            key={index}
            p={4}
            borderRadius="md"
            boxShadow="md"
            bg="white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            border="1px solid"
            borderColor="gray.200"
          >
            <Flex justify="space-between">
              <Text fontWeight="semibold">{house}. Ev</Text>
              <Text color="gray.500">
                {details.sign} {details.degree}°
              </Text>
            </Flex>
          </MotionBox>
        ))}
      </Stack>
    </Box>
  );
};

export default CharacterPage;
