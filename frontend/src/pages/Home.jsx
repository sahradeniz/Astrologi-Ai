import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles, Star, Wand2 } from "lucide-react";

import { getInterpretation } from "../lib/api.js";

const MotionBox = motion(Box);

const fallbackInsight = {
  headline: "Your Cosmic Insight",
  summary:
    "Take a breath. The sky is rearranging itself so you can rediscover what feels luminous to you.",
  advice: "Trust the cadence of your intuition today.",
};

const orbitSegments = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "year", label: "This Year" },
];

const auraFriends = [
  { name: "Amal", vibe: "Radiant", hint: "Sun trine Venus", emoji: "🌞" },
  { name: "Kai", vibe: "Deep Tide", hint: "Moon in Pisces", emoji: "🌊" },
  { name: "Noor", vibe: "Spark", hint: "Mars sextile Mercury", emoji: "⚡" },
];

const Home = () => {
  const [chart, setChart] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeOrbit, setActiveOrbit] = useState("today");
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
      const cachedData = JSON.parse(cached);
      setInsight(cachedData.ai_interpretation);
    } else {
      loadInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  const dailyThemes = useMemo(() => chart?.core_themes || [], [chart]);
  const profile = useMemo(() => {
    try {
      const stored = localStorage.getItem("userProfile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const greetingName = profile?.firstName ? profile.firstName : "Stargazer";
  const today = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  if (!chart) {
    return (
      <Container maxW="container.sm" py={{ base: 16, md: 24 }}>
        <VStack spacing={8} align="center" textAlign="center">
          <Heading fontSize={{ base: "3xl", md: "4xl" }}>
            Welcome to Jovia
          </Heading>
          <Text color="rgba(30,27,41,0.7)">
            Tell us about your birth chart first so we can personalise your insights.
          </Text>
          <Button
            size="lg"
            variant="gradient"
            onClick={() => window.location.assign("/")}
          >
            Start Onboarding
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={{ base: 10, md: 14 }}>
      <VStack spacing={{ base: 10, md: 12 }} align="stretch">
        <MotionBox
          position="relative"
          overflow="hidden"
          borderRadius="32px"
          bg="rgba(250, 249, 251, 0.94)"
          px={{ base: 6, md: 10 }}
          py={{ base: 8, md: 10 }}
          boxShadow="aura"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Box
            position="absolute"
            inset="-40% 0 auto"
            height="160%"
            bgGradient="radial(at 25% 25%, rgba(92,107,242,0.35), transparent 65%)"
            pointerEvents="none"
          />
          <Stack spacing={{ base: 6, md: 7 }} position="relative">
            <Stack spacing={2}>
              <Text
                fontSize="sm"
                letterSpacing="0.35em"
                color="rgba(30,27,41,0.55)"
                textTransform="uppercase"
              >
                Hi, {greetingName}
              </Text>
              <Heading fontSize={{ base: "2.75rem", md: "3.25rem" }} lineHeight="1.05">
                The stars have something special for you today.
              </Heading>
              <Text color="rgba(30,27,41,0.7)" maxW="2xl">
                Your cosmic journal opens with whispers about your creative courage and the connections lighting up your orbit.
              </Text>
            </Stack>

            <Box
              border="1.5px dashed rgba(30,27,41,0.18)"
              borderRadius="24px"
              px={{ base: 2, md: 3 }}
              py={{ base: 1.5, md: 2 }}
              bg="rgba(255,255,255,0.6)"
              w={{ base: "full", md: "fit-content" }}
            >
              <HStack spacing={1.5}>
                {orbitSegments.map((segment) => {
                  const isActive = activeOrbit === segment.id;
                  return (
                    <Button
                      key={segment.id}
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveOrbit(segment.id)}
                      bg={isActive ? "brand.blue" : "transparent"}
                      color={isActive ? "brand.ivory" : "brand.midnight"}
                      _hover={{
                        bg: isActive ? "brand.blue" : "rgba(92,107,242,0.12)",
                      }}
                    >
                      {segment.label}
                    </Button>
                  );
                })}
              </HStack>
            </Box>

            <HStack spacing={4} align="center" flexWrap="wrap">
              <Text
                fontFamily="'Playfair Display', serif"
                fontSize="lg"
                color="rgba(30,27,41,0.8)"
                letterSpacing="0.2em"
              >
                {today}
              </Text>
              <Divider
                orientation="vertical"
                height="18px"
                borderColor="rgba(30,27,41,0.16)"
              />
              <Button
                variant="gradient"
                leftIcon={<RefreshCw size={18} />}
                onClick={loadInsight}
                isLoading={loading}
                loadingText="Refreshing"
              >
                Refresh insight
              </Button>
            </HStack>
          </Stack>
        </MotionBox>

        <MotionBox
          borderRadius="32px"
          p={{ base: 6, md: 8 }}
          bg="rgba(255,255,255,0.95)"
          boxShadow="soft"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        >
          <Stack spacing={{ base: 5, md: 6 }}>
            <HStack spacing={3}>
              <Icon as={Sparkles} color="brand.blue" />
              <Text
                fontSize="sm"
                letterSpacing="0.4em"
                textTransform="uppercase"
                color="rgba(30,27,41,0.55)"
              >
                Your Daily Horoscope
              </Text>
            </HStack>
            <Box w="72px" borderBottom="3px dotted rgba(30,27,41,0.35)" mb={2} />
            {loading && !insight ? (
              <Spinner color="brand.blue" />
            ) : (
              <VStack align="flex-start" spacing={4}>
                <Heading fontSize={{ base: "2xl", md: "2.5xl" }}>
                  {insight?.headline || fallbackInsight.headline}
                </Heading>
                <Text
                  whiteSpace="pre-line"
                  lineHeight="taller"
                  color="rgba(30,27,41,0.78)"
                >
                  {insight?.summary || fallbackInsight.summary}
                </Text>
                <Text fontStyle="italic" color="brand.blue">
                  {insight?.advice || fallbackInsight.advice}
                </Text>
                <Button variant="outline" size="md" mt={2}>
                  Go back in time
                </Button>
              </VStack>
            )}
          </Stack>
        </MotionBox>

        <Grid
          templateColumns={{ base: "1fr", lg: "1.25fr 0.75fr" }}
          gap={{ base: 6, md: 8 }}
        >
          <MotionBox
            borderRadius="28px"
            p={{ base: 5, md: 6 }}
            bg="rgba(255,255,255,0.92)"
            boxShadow="soft"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
          >
            <Stack spacing={5}>
              <HStack spacing={3}>
                <Icon as={Wand2} color="brand.blue" />
                <Heading fontSize="md" textTransform="uppercase" letterSpacing="0.25em">
                  Themes orbiting you
                </Heading>
              </HStack>
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                {dailyThemes.length ? (
                  dailyThemes.map((theme) => (
                    <Tag
                      key={theme}
                      fontWeight="600"
                      bg="rgba(92,107,242,0.12)"
                      color="brand.midnight"
                      borderRadius="full"
                      px={4}
                      py={2}
                    >
                      {theme}
                    </Tag>
                  ))
                ) : (
                  <Text
                    color="rgba(30,27,41,0.6)"
                    gridColumn={{ base: "span 2", md: "span 3" }}
                  >
                    Themes will orbit here soon.
                  </Text>
                )}
              </SimpleGrid>
            </Stack>
          </MotionBox>

          <MotionBox
            borderRadius="28px"
            p={{ base: 5, md: 6 }}
            bg="linear-gradient(135deg, rgba(220,201,249,0.2) 0%, rgba(92,107,242,0.18) 50%, rgba(253,209,163,0.2) 100%)"
            boxShadow="soft"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.16 }}
          >
            <Stack spacing={4}>
              <Heading fontSize="md" textTransform="uppercase" letterSpacing="0.25em">
                Star friends
              </Heading>
              <Text color="rgba(30,27,41,0.7)">
                Check in with your cosmic crew — their skies are glowing with new stories.
              </Text>
              <VStack align="stretch" spacing={3}>
                {auraFriends.map((friend) => (
                  <HStack
                    key={friend.name}
                    justify="space-between"
                    bg="rgba(255,255,255,0.72)"
                    borderRadius="24px"
                    px={4}
                    py={3}
                  >
                    <HStack spacing={3}>
                      <Box fontSize="xl">{friend.emoji}</Box>
                      <Box>
                        <Text fontWeight="600">{friend.name}</Text>
                        <Text fontSize="sm" color="rgba(30,27,41,0.65)">
                          {friend.hint}
                        </Text>
                      </Box>
                    </HStack>
                    <Tag bg="rgba(255,255,255,0.85)" color="brand.blue" borderRadius="full">
                      {friend.vibe}
                    </Tag>
                  </HStack>
                ))}
              </VStack>
              <Button variant="ghost" alignSelf="flex-start" leftIcon={<Star size={18} />}>
                Share my vibe
              </Button>
            </Stack>
          </MotionBox>
        </Grid>

        <MotionBox
          borderRadius="28px"
          p={{ base: 6, md: 8 }}
          bg="rgba(255,255,255,0.92)"
          boxShadow="soft"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut", delay: 0.18 }}
        >
          <Stack spacing={5}>
            <HStack spacing={3}>
              <Icon as={Sparkles} color="brand.blue" />
              <Heading fontSize="md" textTransform="uppercase" letterSpacing="0.25em">
                Today’s moon forecast
              </Heading>
            </HStack>
            <Grid templateColumns={{ base: "1fr", md: "repeat(3,1fr)" }} gap={4}>
              <GridItem>
                <Box
                  bg="rgba(92,107,242,0.08)"
                  borderRadius="24px"
                  p={4}
                  h="100%"
                >
                  <Heading fontSize="sm" mb={2}>
                    Moon Mood
                  </Heading>
                  <Text fontSize="sm" color="rgba(30,27,41,0.7)">
                    Your intuition is sparkling. Capture ideas before they float away.
                  </Text>
                </Box>
              </GridItem>
              <GridItem>
                <Box
                  bg="rgba(253,209,163,0.18)"
                  borderRadius="24px"
                  p={4}
                  h="100%"
                >
                  <Heading fontSize="sm" mb={2}>
                    Ritual Suggestion
                  </Heading>
                  <Text fontSize="sm" color="rgba(30,27,41,0.7)">
                    Light a candle, journal three gratitudes, and breathe into what is ripening.
                  </Text>
                </Box>
              </GridItem>
              <GridItem>
                <Box
                  bg="rgba(220,201,249,0.18)"
                  borderRadius="24px"
                  p={4}
                  h="100%"
                >
                  <Heading fontSize="sm" mb={2}>
                    Element Balance
                  </Heading>
                  <Text fontSize="sm" color="rgba(30,27,41,0.7)">
                    Fire is high, water is steady. Ground through nourishing food and movement.
                  </Text>
                </Box>
              </GridItem>
            </Grid>
          </Stack>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default Home;
