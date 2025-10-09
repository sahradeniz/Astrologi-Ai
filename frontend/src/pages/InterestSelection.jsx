import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MotionBadge = motion(Badge);

const interests = [
  "Art",
  "Business",
  "Psychology",
  "Spirituality",
  "Friendship",
  "Travel",
  "Mindfulness",
  "Learning",
  "Creativity",
  "Love",
];

const InterestSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const toggleInterest = (interest) => {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  };

  const handleContinue = () => {
    navigate("/home");
  };

  return (
    <Container maxW="container.sm" py={{ base: 12, md: 16 }}>
      <VStack spacing={10} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" color="whiteAlpha.900">
            Tell us what lights you up
          </Heading>
          <Text mt={3} color="whiteAlpha.800">
            Pick a few interests and we’ll tailor your cosmic insights.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
          {interests.map((interest) => {
            const isActive = selected.includes(interest);
            return (
              <MotionBadge
                key={interest}
                cursor="pointer"
                onClick={() => toggleInterest(interest)}
                borderRadius="full"
                textAlign="center"
                px={4}
                py={3}
                fontSize="md"
                color={isActive ? "white" : "purple.700"}
                bgGradient={
                  isActive
                    ? "linear(to-r, #8E2DE2, #4A00E0)"
                    : "linear(to-r, rgba(255,255,255,0.85), rgba(255,255,255,0.65))"
                }
                boxShadow={isActive ? "lg" : "base"}
                transition="all 0.2s ease"
                whileTap={{ scale: 0.95 }}
              >
                {interest}
              </MotionBadge>
            );
          })}
        </SimpleGrid>

        <Button
          size="lg"
          borderRadius="full"
          bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
          color="white"
          _hover={{ opacity: 0.9 }}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </VStack>
    </Container>
  );
};

export default InterestSelection;
