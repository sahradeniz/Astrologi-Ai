import { Badge, Card, CardBody, Heading, Text, VStack } from "@chakra-ui/react";

const ThisYearYou = () => (
  <VStack spacing={8} align="stretch">
    <Heading
      size="xl"
      bgGradient="linear(to-r, #FF6CAB, #7366FF)"
      bgClip="text"
    >
      This Year, You
    </Heading>
    <Card borderRadius="2xl" bg="whiteAlpha.900" boxShadow="xl">
      <CardBody>
        <VStack spacing={4} align="flex-start">
          <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
            Coming Soon
          </Badge>
          <Text color="gray.700">
            Soon you’ll receive a living roadmap for the months ahead — transit
            highlights, seasonal rituals, and supportive actions attuned to your
            chart.
          </Text>
          <Text color="gray.500">
            Our team is weaving the stellar threads. Stay luminous ✨
          </Text>
        </VStack>
      </CardBody>
    </Card>
  </VStack>
);

export default ThisYearYou;
