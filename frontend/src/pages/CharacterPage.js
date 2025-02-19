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
import BirthChart from '../components/BirthChart';
import PersonalityTraits from '../components/PersonalityTraits';
import LifePurpose from '../components/LifePurpose';
import PlanetaryPositions from '../components/PlanetaryPositions';

const CharacterPage = () => {
  const [chartData, setChartData] = useState(null);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" mb={8}>
          <Heading as="h1" size="2xl" mb={4}>
            Doğum Haritası Analizi
          </Heading>
          <Text fontSize="xl" color="gray.500">
            Kişisel özellikleriniz, yetenekleriniz ve yaşam amacınız
          </Text>
        </Box>

        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Doğum Haritası</Tab>
            <Tab>Kişilik Özellikleri</Tab>
            <Tab>Yaşam Amacı</Tab>
            <Tab>Gezegen Pozisyonları</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <BirthChart data={chartData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <PersonalityTraits data={chartData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <LifePurpose data={chartData} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
                <PlanetaryPositions data={chartData} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default CharacterPage;
