import { useCallback } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  Heading,
  HStack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Share2, Users } from "lucide-react";

const MotionBox = motion(Box);

const mockProfile = {
  username: "celestial.mira",
  archetype: "The Visionary",
  interpretation: {
    headline: "Echoes of Stardust",
    summary: `You are entering a season where vision and vulnerability travel hand in hand.
Your chart hums with the electricity of new beginnings, yet it feels the echo of old stories asking to be rewritten.
Let the rhythm of your inner tides teach you the choreography of trust.
Share your fire with companions who can hold its light without fear.`,
    advice: "Follow the shimmer, even if your steps tremble.",
  },
  themes: ["growth", "challenge", "intuition", "flow"],
  tone: "Mythic rebirth anchored in radiant compassion.",
};

const Profile = () => {
  const handleShareStory = useCallback(() => {
    window.alert("Story sharing is coming soon — your constellation awaits!");
  }, []);

  const handleFriendsClick = useCallback(() => {
    window.alert("Friends feature coming soon!");
  }, []);

  const { username, archetype, interpretation, themes, tone } = mockProfile;

  return (
    <Container maxW="4xl" py={{ base: 12, md: 16 }}>
      <VStack spacing={10} align="stretch">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card
            bgGradient="linear(to-r, #B3E5FC, #E1BEE7)"
            borderRadius="2xl"
            boxShadow="xl"
            overflow="hidden"
          >
            <CardBody>
              <HStack spacing={6} align="center">
                <Avatar
                  name={username}
                  size="xl"
                  bg="blackAlpha.200"
                  border="4px solid rgba(255,255,255,0.6)"
                />
                <VStack align="flex-start" spacing={1}>
                  <Heading size="lg" color="blackAlpha.800" letterSpacing="wide">
                    @{username}
                  </Heading>
                  <Badge
                    variant="subtle"
                    colorScheme="purple"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontWeight="medium"
                  >
                    {archetype}
                  </Badge>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        >
          <Card borderRadius="2xl" bg="white" boxShadow="xl" p={1}>
            <CardBody>
              <VStack align="flex-start" spacing={4}>
                <Heading size="md" color="purple.600">
                  {interpretation.headline}
                </Heading>
                <Text
                  whiteSpace="pre-line"
                  color="purple.700"
                  fontSize="md"
                  lineHeight="taller"
                >
                  {interpretation.summary}
                </Text>
                <Divider borderColor="purple.100" />
                <Text fontStyle="italic" color="purple.600">
                  {interpretation.advice}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <Card borderRadius="2xl" bg="white" boxShadow="lg">
            <CardBody>
              <VStack align="flex-start" spacing={4}>
                <Heading size="sm" color="gray.700" letterSpacing="wide">
                  Active Themes
                </Heading>
                <Wrap spacing={3}>
                  {themes.map((theme) => (
                    <WrapItem key={theme}>
                      <Badge
                        colorScheme="purple"
                        variant="subtle"
                        px={3}
                        py={1}
                        borderRadius="full"
                        textTransform="capitalize"
                      >
                        {theme}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
                <Box>
                  <Text fontSize="sm" color="gray.500" textTransform="uppercase" letterSpacing="widest">
                    Story Tone
                  </Text>
                  <Text color="gray.700" mt={1}>
                    {tone}
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        >
          <VStack spacing={4}>
            <Button
              w="full"
              size="lg"
              leftIcon={<Share2 size={20} />}
              bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
              color="white"
              borderRadius="full"
              _hover={{ opacity: 0.9 }}
              onClick={handleShareStory}
            >
              Share your Cosmic Story
            </Button>

            <Button
              w="full"
              size="lg"
              leftIcon={<Users size={20} />}
              bgGradient="linear(to-r, #FF8A00, #E52E71)"
              color="white"
              borderRadius="full"
              _hover={{ opacity: 0.9 }}
              onClick={handleFriendsClick}
            >
              My Friends
            </Button>
          </VStack>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default Profile;
