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
import SynastryChart from '../components/SynastryChart';
import RelationshipDynamics from '../components/RelationshipDynamics';
import CompatibilityScore from '../components/CompatibilityScore';
import AspectAnalysis from '../components/AspectAnalysis';

const SynastryPage = () => {
  const [synastryData, setSynastryData] = useState(null);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" mb={8}>
          <Heading as="h1" size="2xl" mb={4}>
            İlişki Uyumu Analizi
          </Heading>
          <Text fontSize="xl" color="gray.500">
            İki kişi arasındaki astrolojik uyum ve ilişki dinamikleri
          </Text>
        </Box>

        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Sinastri Haritası</Tab>
            <Tab>İlişki Dinamikleri</Tab>
            <Tab>Uyum Skoru</Tab>
            <Tab>Açı Analizi</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <SynastryChart data={synastryData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <RelationshipDynamics data={synastryData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <CompatibilityScore data={synastryData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <AspectAnalysis data={synastryData} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default SynastryPage;
