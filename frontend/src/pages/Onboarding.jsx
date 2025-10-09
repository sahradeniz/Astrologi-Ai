import { Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <Container maxW="lg" py={{ base: 16, md: 24 }}>
      <VStack spacing={8} align="stretch">
        <Heading
          size="2xl"
          bgGradient="linear(to-r, #7928CA, #FF0080)"
          bgClip="text"
          textAlign="center"
        >
          Welcome to Jovia
        </Heading>
        <Text fontSize="lg" color="whiteAlpha.900" textAlign="center">
          A luminous space for cosmic insight, soulful friendships, and mythic storytelling.
        </Text>
        <Button
          size="lg"
          colorScheme="purple"
          borderRadius="full"
          onClick={() => navigate("/home")}
          alignSelf="center"
        >
          Begin Your Journey
        </Button>
      </VStack>
    </Container>
  );
};

export default Onboarding;
