import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import CurrentTransits from '../components/CurrentTransits';
import FutureTransits from '../components/FutureTransits';
import TransitTimeline from '../components/TransitTimeline';
import TransitPredictions from '../components/TransitPredictions';

const TransitPage = () => {
  const [transitData, setTransitData] = useState(null);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" mb={8}>
          <Heading as="h1" size="2xl" mb={4}>
            Transit Analizi
          </Heading>
          <Text fontSize="xl" color="gray.500">
            Şu anki ve gelecekteki gezegen transitlerinin etkileri
          </Text>
        </Box>

        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Güncel Transitler</Tab>
            <Tab>Gelecek Transitler</Tab>
            <Tab>Transit Zaman Çizelgesi</Tab>
            <Tab>Tahminler</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <CurrentTransits data={transitData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <FutureTransits data={transitData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <TransitTimeline data={transitData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <TransitPredictions data={transitData} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default TransitPage;
