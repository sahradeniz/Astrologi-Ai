import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  Icon,
  HStack,
  Image,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

import { getInterpretation } from "../lib/api.js";

const MotionBox = motion(Box);

const gallery = [
  "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470104240373-bc1812eddc9f?auto=format&fit=crop&w=800&q=80",
];

const StoryStudio = () => {
  const [chart, setChart] = useState(null);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("userChart");
    if (stored) {
      setChart(JSON.parse(stored));
    }
  }, []);

  const archetype = useMemo(() => chart?.story_tone || "Radiant Expansion", [chart]);

  const fetchStory = async () => {
    if (!chart) return;
    setLoading(true);
    try {
      const res = await getInterpretation(chart);
      const categories = res?.categories || {};
      const chosen =
        categories.spiritual ||
        categories.love ||
        categories.career ||
        categories.shadow ||
        null;
      setStory(chosen);
      if (chosen) {
        localStorage.setItem("userStory", JSON.stringify(chosen));
      }
    } catch (error) {
      toast({
        title: "Could not reach the stars",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chart) {
      const cached = localStorage.getItem("userStory");
      if (cached) {
        setStory(JSON.parse(cached));
      } else {
        fetchStory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  if (!chart) {
    return (
      <Container maxW="container.sm" py={{ base: 16, md: 20 }}>
        <VStack spacing={6} textAlign="center" color="white">
          <Heading size="lg">Story Studio</Heading>
          <Text>
            Create your natal chart first to unlock personalized story prompts.
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={{ base: 12, md: 16 }}>
      <VStack spacing={10} align="stretch">
        <Stack spacing={3} color="white">
          <Heading size="2xl">Story Studio</Heading>
          <Text color="whiteAlpha.800">
            Remix your chart into luminous story moments. Pick a mood, generate a scene, share it with your orbit.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {gallery.map((src, index) => (
            <MotionBox
              key={src}
              borderRadius="2xl"
              overflow="hidden"
              position="relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Image src={src} alt="Story" h="220px" w="full" objectFit="cover" />
              <Box
                position="absolute"
                inset={0}
                bg="linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)"
              />
              <VStack
                position="absolute"
                bottom={4}
                left={4}
                align="flex-start"
                spacing={1}
              >
                <Badge colorScheme="purple" borderRadius="full">
                  {archetype}
                </Badge>
                <Text color="white" fontWeight="semibold">
                  {story?.headline || "Mythic Story"}
                </Text>
              </VStack>
            </MotionBox>
          ))}
        </SimpleGrid>

        <MotionBox
          bg="rgba(255,255,255,0.14)"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          boxShadow="xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Stack spacing={4} color="white">
            <HStack spacing={2}>
              <Icon as={Sparkles} color="yellow.300" />
              <Text fontSize="sm" textTransform="uppercase" letterSpacing="widest" color="yellow.200">
                Featured story
              </Text>
            </HStack>
            <Heading size="lg">{story?.headline || "Cosmic Story"}</Heading>
            <Text whiteSpace="pre-line" lineHeight="taller">
              {story?.summary || "Your narrative is ready to unfold. Tap generate to receive a fresh transmission from your chart."}
            </Text>
            <Text fontStyle="italic" color="purple.200">
              {story?.advice || "Let intuition lead your next scene."}
            </Text>
            <Button
              alignSelf="flex-start"
              leftIcon={<RefreshCw size={18} />}
              borderRadius="full"
              bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
              color="white"
              _hover={{ opacity: 0.9 }}
              onClick={fetchStory}
              isLoading={loading}
            >
              Generate another story
            </Button>
          </Stack>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default StoryStudio;
