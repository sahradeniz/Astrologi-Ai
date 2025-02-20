import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
} from '@chakra-ui/react';

const PlanetaryPositions = ({ data }) => {
  if (!data || !data.planet_positions) {
    return (
      <Box p={4}>
        <Text>Gezegen pozisyonları yüklenemedi.</Text>
      </Box>
    );
  }

  const formatDegree = (degree) => {
    return `${Math.floor(degree)}°${Math.floor((degree % 1) * 60)}'`;
  };

  const getZodiacSign = (longitude) => {
    const signs = [
      'Koç', 'Boğa', 'İkizler', 'Yengeç',
      'Aslan', 'Başak', 'Terazi', 'Akrep',
      'Yay', 'Oğlak', 'Kova', 'Balık'
    ];
    const signIndex = Math.floor(longitude / 30);
    return signs[signIndex];
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Gezegen Pozisyonları
      </Text>
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Gezegen</Th>
              <Th>Burç</Th>
              <Th>Derece</Th>
              <Th>Hız</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.entries(data.planet_positions).map(([planet, position]) => (
              <Tr key={planet}>
                <Td>{planet}</Td>
                <Td>{getZodiacSign(position.longitude)}</Td>
                <Td>{formatDegree(position.longitude % 30)}</Td>
                <Td>{position.speed_longitude.toFixed(2)}°/gün</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
};

export default PlanetaryPositions;
