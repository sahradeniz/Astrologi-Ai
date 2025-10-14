import { Card, CardHeader, CardBody, Heading, Text, Tag, Stack } from "@chakra-ui/react";

const InterpretationCard = ({ title, data }) => {
  if (!data) return null;

  return (
    <Card
      bg="rgba(255,255,255,0.08)"
      borderRadius="2xl"
      p={5}
      shadow="xl"
      mb={4}
      backdropFilter="blur(10px)"
    >
      <CardHeader>
        <Heading size="md" color="purple.200">
          {title}
        </Heading>
        <Text fontWeight="bold" mt={2}>
          {data.headline}
        </Text>
      </CardHeader>
      <CardBody>
        <Text mb={3}>{data.summary}</Text>
        <Text fontStyle="italic" color="teal.300">
          {data.advice}
        </Text>
        <Stack direction="row" mt={3} spacing={2} flexWrap="wrap">
          {data.themes?.map((theme, i) => (
            <Tag key={i} colorScheme="purple" variant="subtle">
              {theme}
            </Tag>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default InterpretationCard;
