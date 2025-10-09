import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Sparkles, Search, RefreshCw } from "lucide-react";

import { getInterpretation } from "../lib/api.js";

const MotionBox = motion(Box);

const fallbackInsight = {
  headline: "Your Cosmic Insight",
  summary:
    "Take a breath. The sky is rearranging itself so you can rediscover what feels luminous to you.",
  advice: "Trust the cadence of your intuition today.",
};

const Home = () => {
  const [chart, setChart] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("userChart");
    if (stored) {
      setChart(JSON.parse(stored));
    }
  }, []);

  const loadInsight = async () => {
    if (!chart) return;
    setLoading(true);
    try {
      const data = await getInterpretation(chart);
      setInsight(data.ai_interpretation);
      localStorage.setItem("userInsight", JSON.stringify(data));
    } catch (error) {
      toast({
        title: "We lost the signal",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chart) return;
    const cached = localStorage.getItem("userInsight");
    if (cached) {
      setInsight(JSON.parse(cached).ai_interpretation);
    } else {
      loadInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  const dailyThemes = useMemo(() => chart?.core_themes || [], [chart]);

  if (!chart) {
    return (
      <Container maxW="container.sm" py={{ base: 16, md: 24 }}>
        <VStack spacing={6} align="center" textAlign="center">
          <Heading color="white" size="lg">
            Welcome to Jovia
          </Heading>
          <Text color="whiteAlpha.800">
            Tell us about your birth chart first so we can personalize your insights.
          </Text>
          <Button
            size="lg"
            borderRadius="full"
            bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
            color="white"
            _hover={{ opacity: 0.9 }}
            onClick={() => window.location.assign("/")}
          >
            Start Onboarding
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={{ base: 12, md: 16 }}>
      <VStack spacing={10} align="stretch">
        <MotionBox
          bg="rgba(255,255,255,0.12)"
          borderRadius="2xl"
          p={6}
          boxShadow="xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Stack spacing={4}>
            <Heading size="lg" color="white">
              Who are you this year?
            </Heading>
            <HStack bg="whiteAlpha.200" borderRadius="full" px={4} py={3}>
              <Icon as={Search} color="purple.200" />
              <Input
                variant="unstyled"
                placeholder="Search transits, archetypes, or rituals"
                color="white"
              />
            </HStack>
            <Text color="whiteAlpha.900">
              Your chart hums with a bright curiosity. Keep orbiting the ideas that make your
              heart starglow.
            </Text>
            <Button
              leftIcon={<RefreshCw size={18} />}
              alignSelf="flex-start"
              borderRadius="full"
              bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
              color="white"
              onClick={loadInsight}
              isLoading={loading}
            >
              Refresh insight
            </Button>
          </Stack>
        </MotionBox>

        <MotionBox
          bg="rgba(255,255,255,0.16)"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          boxShadow="2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        >
          <Stack spacing={5}>
            <HStack spacing={3}>
              <Icon as={Sparkles} color="yellow.300" />
              <Text
                fontSize="xs"
                letterSpacing="widest"
                textTransform="uppercase"
                color="yellow.200"
              >
                Daily insight
              </Text>
            </HStack>
            {loading && !insight ? (
              <Spinner color="white" />
            ) : (
              <VStack align="flex-start" spacing={4} color="white">
                <Heading size="lg">
                  {insight?.headline || fallbackInsight.headline}
                </Heading>
                <Text whiteSpace="pre-line" lineHeight="taller">
                  {insight?.summary || fallbackInsight.summary}
                </Text>
                <Text fontStyle="italic" color="purple.200">
                  {insight?.advice || fallbackInsight.advice}
                </Text>
              </VStack>
            )}
          </Stack>
        </MotionBox>

        <MotionBox
          bg="rgba(255,255,255,0.14)"
          borderRadius="2xl"
          p={6}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <Stack spacing={4}>
            <Heading size="sm" color="whiteAlpha.900">
              Themes orbiting you
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              {dailyThemes.length ? (
                dailyThemes.map((theme) => (
                  <Badge
                    key={theme}
                    colorScheme="purple"
                    borderRadius="full"
                    px={3}
                    py={2}
                    textTransform="capitalize"
                    textAlign="center"
                  >
                    {theme}
                  </Badge>
                ))
              ) : (
                <Text color="whiteAlpha.800">Themes will appear once we gather more data.</Text>
              )}
            </SimpleGrid>
          </Stack>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default Home;
