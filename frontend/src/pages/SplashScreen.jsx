import {
  Box,
  Button,
  Circle,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const MotionVStack = motion(VStack);
const MotionCircle = motion(Circle);

const moodFaces = [
  { emoji: "🙂", bg: "#2E4CE8" },
  { emoji: "😊", bg: "#5BD4A4" },
  { emoji: "😌", bg: "#F4A340" },
  { emoji: "🪐", bg: "#66C5FF" },
  { emoji: "🤗", bg: "#4F8BFF" },
  { emoji: "🧡", bg: "#FF6F61" },
  { emoji: "🌸", bg: "#FF9BCD" },
  { emoji: "✨", bg: "#FFD75E" },
];

const SplashScreen = () => {
  const navigate = useNavigate();
  const faceItems = useMemo(
    () =>
      moodFaces.map((face, index) => (
        <MotionCircle
          key={face.emoji + index}
          size={{ base: "56px", md: "64px" }}
          bg={face.bg}
          color="white"
          fontSize="2xl"
          fontWeight="semibold"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
        >
          {face.emoji}
        </MotionCircle>
      )),
    []
  );

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, #0C3BA0, #8945D8)"
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      position="relative"
    >
      <Box
        position="absolute"
        bottom={{ base: "-120px", md: "-160px" }}
        right={{ base: "-80px", md: "-100px" }}
        w={{ base: "240px", md: "320px" }}
        h={{ base: "240px", md: "320px" }}
        border="1px dashed rgba(255,255,255,0.4)"
        borderRadius="50%"
        opacity={0.4}
        transform="rotate(12deg)"
      />

      <Container maxW="xs">
        <MotionVStack
          spacing={8}
          align="center"
          textAlign="center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <SimpleGrid columns={4} spacing={4}>
            {faceItems}
          </SimpleGrid>

          <VStack spacing={1}>
            <Text fontSize="sm" letterSpacing="widest" textTransform="uppercase">
              Astrology AI
            </Text>
            <Heading size="3xl" letterSpacing="tight">
              Jovia
            </Heading>
          </VStack>

          <Box w="60px" h="2px" bg="whiteAlpha.600" borderRadius="full" />

          <Text fontSize="lg" color="whiteAlpha.900">
            Know yourself in a fun way
          </Text>

          <Button
            size="lg"
            borderRadius="full"
            px={10}
            bg="white"
            color="purple.700"
            _hover={{ opacity: 0.9 }}
            onClick={() => navigate("/onboarding")}
          >
            Begin the Journey
          </Button>
        </MotionVStack>
      </Container>
    </Box>
  );
};

export default SplashScreen;
