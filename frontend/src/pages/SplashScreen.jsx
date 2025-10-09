import { Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MotionVStack = motion(VStack);

const SplashScreen = () => {
  const navigate = useNavigate();

  return (
    <Container
      maxW="md"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <MotionVStack
        spacing={10}
        align="center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Heading
          size="4xl"
          bgGradient="linear(to-r, #FAD961, #F76B1C)"
          bgClip="text"
          letterSpacing="widest"
        >
          Jovia
        </Heading>
        <Text
          fontSize="lg"
          color="whiteAlpha.900"
          textAlign="center"
          maxW="sm"
        >
          Know yourself in a fun, cosmic, and social way. Your stars are ready.
        </Text>
        <Button
          size="lg"
          borderRadius="full"
          bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
          color="white"
          px={12}
          onClick={() => navigate("/onboarding")}
          _hover={{ opacity: 0.9 }}
        >
          Enter the Cosmos
        </Button>
      </MotionVStack>
    </Container>
  );
};

export default SplashScreen;
