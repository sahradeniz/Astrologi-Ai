import React from 'react';
import { Box, Container, Grid, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import DailyHoroscope from '../components/DailyHoroscope';
import TransitHighlights from '../components/TransitHighlights';
import QuickAccess from '../components/QuickAccess';
import TrendingTopics from '../components/TrendingTopics';

const HomePage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" mb={8}>
          <Heading as="h1" size="2xl" mb={4}>
            Astroloji AI
          </Heading>
          <Text fontSize="xl" color="gray.500">
            Kişiselleştirilmiş astrolojik içgörüler ve tahminler
          </Text>
        </Box>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8}>
          {/* Daily Horoscope Section */}
          <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
            <DailyHoroscope />
          </Box>

          {/* Transit Highlights Section */}
          <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
            <TransitHighlights />
          </Box>

          {/* Quick Access Section */}
          <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
            <QuickAccess />
          </Box>

          {/* Trending Topics Section */}
          <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
            <TrendingTopics />
          </Box>
        </Grid>
      </VStack>
    </Container>
  );
};

export default HomePage;
