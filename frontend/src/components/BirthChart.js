import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

const BirthChart = ({ data }) => {
  if (!data || !data.planet_positions) {
    return (
      <Box p={4}>
        <Text>Doğum haritası yüklenemedi.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Doğum Haritası
      </Text>
      <Box>
        {/* TODO: Add visual chart representation */}
        <Text>Doğum haritası görsel temsili eklenecek.</Text>
      </Box>
    </VStack>
  );
};

export default BirthChart;
