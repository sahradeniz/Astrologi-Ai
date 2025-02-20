import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

const LifePurpose = ({ data }) => {
  if (!data || !data.planet_positions) {
    return (
      <Box p={4}>
        <Text>Yaşam amacı bilgileri yüklenemedi.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Yaşam Amacı
      </Text>
      <Box>
        <Text>
          {/* TODO: Add life purpose interpretation based on North Node and other significant placements */}
          Kuzey Ay Düğümü pozisyonunuza göre yaşam amacınız ve gelişim yönünüz burada gösterilecek.
        </Text>
      </Box>
    </VStack>
  );
};

export default LifePurpose;
