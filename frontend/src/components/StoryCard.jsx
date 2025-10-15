import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";

const gradients = {
  visionary: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
  alchemist: "linear-gradient(135deg, #FF6CAB 0%, #7366FF 100%)",
  shadow: "linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)",
  dawn: "linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)",
};

const MotionBox = motion(Box);

const StoryCard = ({
  title,
  summary,
  ctaText = "Continue",
  onContinue,
  variant = "visionary",
}) => {
  const gradient = gradients[variant] || gradients.visionary;

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      minH="100vh"
      w="full"
      bgGradient={gradient}
      position="relative"
      overflow="hidden"
      color="white"
      px={6}
      py={10}
    >
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)"
      />
      <VStack
        position="relative"
        minH="100vh"
        align="center"
        justify="center"
        spacing={8}
        textAlign="center"
        px={{ base: 4, md: 16 }}
      >
        <Heading
          size="2xl"
          letterSpacing="widest"
          textTransform="uppercase"
          textShadow="0 8px 30px rgba(0,0,0,0.35)"
        >
          {title}
        </Heading>
        <Text
          fontSize={{ base: "lg", md: "2xl" }}
          lineHeight="taller"
          maxW="3xl"
          textShadow="0 4px 16px rgba(0,0,0,0.35)"
        >
          {summary}
        </Text>
        <Button
          size="lg"
          borderRadius="full"
          bg="rgba(255,255,255,0.18)"
          color="white"
          px={12}
          py={6}
          _hover={{ bg: "rgba(255,255,255,0.28)" }}
          backdropFilter="blur(8px)"
          onClick={onContinue}
        >
          {ctaText}
        </Button>
      </VStack>
    </MotionBox>
  );
};

export default StoryCard;
