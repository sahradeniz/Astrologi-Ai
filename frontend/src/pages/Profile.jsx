import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import InterpretationCard from "../components/InterpretationCard.jsx";
import { getInterpretation } from "../lib/api.js";

const MotionBox = motion(Box);

const Profile = () => {
  const [chart, setChart] = useState(null);
  const [categories, setCategories] = useState(null);
  const [loadingInterpretation, setLoadingInterpretation] = useState(false);
  const [interpretationError, setInterpretationError] = useState(null);

  useEffect(() => {
    const savedChart = localStorage.getItem("userChart");
    if (savedChart) setChart(JSON.parse(savedChart));
  }, []);

  useEffect(() => {
    if (!chart) return;

    const fetchInterpretation = async () => {
      setLoadingInterpretation(true);
      setInterpretationError(null);
      try {
        const response = await getInterpretation(chart);
        setCategories(response?.categories || null);
      } catch (error) {
        setInterpretationError(error.message);
      } finally {
        setLoadingInterpretation(false);
      }
    };

    fetchInterpretation();
  }, [chart]);

  if (!chart) {
    return (
      <Container maxW="container.sm" py={{ base: 16, md: 20 }}>
        <VStack spacing={6} textAlign="center" color="white">
          <Heading size="lg">Profile</Heading>
          <Text>Create your chart to unlock your profile.</Text>
        </VStack>
      </Container>
    );
  }

  const username = chart.name || "stargazer";

  return (
    <Container maxW="container.md" py={{ base: 12, md: 16 }}>
      <VStack spacing={10} align="stretch">
        <MotionBox
          bg="rgba(255,255,255,0.16)"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          boxShadow="2xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack direction={{ base: "column", md: "row" }} spacing={6} align="center">
            <Avatar
              name={username}
              size="xl"
              border="4px solid rgba(255,255,255,0.6)"
              bg="rgba(0,0,0,0.1)"
            />
            <VStack align="flex-start" spacing={2} color="white">
              <Heading size="lg">@{username.toLowerCase()}</Heading>
              <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                {chart.planets?.Sun?.sign || "Solar Mystic"}
              </Badge>
              <Text color="whiteAlpha.800">
                Story tone: {chart.story_tone || "Balanced growth"}
              </Text>
            </VStack>
          </Stack>
        </MotionBox>

        <MotionBox
          bg="rgba(255,255,255,0.12)"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          boxShadow="xl"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={4} color="white">
            <Heading size="md">Cosmic Interpretation</Heading>
            {loadingInterpretation && <Text color="whiteAlpha.700">Loading your cosmic insights...</Text>}
            {interpretationError && (
              <Text color="red.300">{interpretationError}</Text>
            )}
            {categories ? (
              <>
                <InterpretationCard
                  title="💖 Love & Relationships"
                  data={categories.love}
                />
                <InterpretationCard
                  title="💼 Career & Purpose"
                  data={categories.career}
                />
                <InterpretationCard
                  title="🌱 Spiritual Growth"
                  data={categories.spiritual}
                />
                <InterpretationCard
                  title="🌑 Shadow Integration"
                  data={categories.shadow}
                />
              </>
            ) : ( !loadingInterpretation && !interpretationError && (
              <Text color="whiteAlpha.700">Interpretation will appear after we receive the latest guidance.</Text>
            ))}
          </Stack>
        </MotionBox>

        <MotionBox
          bg="rgba(255,255,255,0.14)"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={4} color="white">
            <Heading size="md">Planetary snapshot</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {Object.entries(chart.planets || {}).map(([planet, details]) => (
                <Box
                  key={planet}
                  borderRadius="lg"
                  bg="rgba(0,0,0,0.25)"
                  p={4}
                  border="1px solid rgba(255,255,255,0.12)"
                >
                  <Text fontWeight="semibold">{planet}</Text>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    {details.sign} • {details.longitude}° • House {details.house}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </MotionBox>

        <MotionBox
          bg="rgba(255,255,255,0.1)"
          borderRadius="2xl"
          p={6}
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <VStack spacing={3} color="white">
            <Heading size="sm">Friends constellation</Heading>
            <Text color="whiteAlpha.700">
              Invite friends soon to see how your stories interlace.
            </Text>
            <Button
              leftIcon={<Users size={18} />}
              borderRadius="full"
              alignSelf="flex-start"
              bgGradient="linear(to-r, #FF8A00, #E52E71)"
              color="white"
              _hover={{ opacity: 0.9 }}
              onClick={() => alert("Friends feature coming soon!")}
            >
              My friends
            </Button>
          </VStack>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default Profile;
