import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Progress,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Avatar,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import { useLocation, Navigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../config';

const SynastryResultsPage = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.700');

  if (!location.state?.result) {
    return <Navigate to="/" replace />;
  }

  const { result, person1, person2 } = location.state;

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="xl" mb={2}>Uyum Analizi Sonuçları</Heading>
            <HStack justify="center" spacing={4}>
              <VStack>
                <Avatar size="lg" name={person1.name} src={DEFAULT_AVATAR} />
                <Text fontWeight="bold">{person1.name}</Text>
              </VStack>
              <Text fontSize="2xl">❤️</Text>
              <VStack>
                <Avatar size="lg" name={person2.name} src={DEFAULT_AVATAR} />
                <Text fontWeight="bold">{person2.name}</Text>
              </VStack>
            </HStack>
          </Box>

          {/* Compatibility Score */}
          <Card bg={cardBgColor}>
            <CardHeader>
              <Heading size="md">Uyum Skoru</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Progress
                  value={result.compatibility_score}
                  colorScheme="purple"
                  size="lg"
                  width="100%"
                  borderRadius="full"
                />
                <Text fontSize="2xl" fontWeight="bold">
                  %{result.compatibility_score}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Aspects */}
          <Card bg={cardBgColor}>
            <CardHeader>
              <Heading size="md">Gezegen Açıları</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                {result.aspects.map((aspect, index) => (
                  <GridItem key={index}>
                    <Box p={4} borderWidth="1px" borderRadius="lg">
                      <Heading size="sm" mb={2}>
                        {aspect.planet1} - {aspect.planet2}
                      </Heading>
                      <Text mb={2}>Açı: {aspect.aspect}</Text>
                      <Text mb={2}>Orb: {aspect.orb}°</Text>
                      <Text>{aspect.description}</Text>
                    </Box>
                  </GridItem>
                ))}
              </Grid>
            </CardBody>
          </Card>

          {/* Summary */}
          <Card bg={cardBgColor}>
            <CardHeader>
              <Heading size="md">Özet</Heading>
            </CardHeader>
            <CardBody>
              <Text>{result.summary}</Text>
            </CardBody>
          </Card>

          {/* Recommendations */}
          <Card bg={cardBgColor}>
            <CardHeader>
              <Heading size="md">Öneriler</Heading>
            </CardHeader>
            <CardBody>
              <List spacing={3}>
                {result.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListIcon as={MdCheckCircle} color="green.500" />
                    {recommendation}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default SynastryResultsPage;
