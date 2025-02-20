import React from 'react';
import { Box, Text, VStack, List, ListItem, ListIcon } from '@chakra-ui/react';
import { MdStar } from 'react-icons/md';

const PersonalityTraits = ({ data }) => {
  if (!data || !data.planet_positions) {
    return (
      <Box p={4}>
        <Text>Kişilik özellikleri yüklenemedi.</Text>
      </Box>
    );
  }

  // TODO: Add personality trait interpretation based on planet positions
  const traits = [
    'Güçlü irade',
    'Yaratıcı düşünce',
    'Duygusal derinlik',
    'İletişim becerisi',
    'Liderlik yeteneği'
  ];

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Kişilik Özellikleri
      </Text>
      <List spacing={3}>
        {traits.map((trait, index) => (
          <ListItem key={index} display="flex" alignItems="center">
            <ListIcon as={MdStar} color="yellow.500" />
            {trait}
          </ListItem>
        ))}
      </List>
    </VStack>
  );
};

export default PersonalityTraits;
