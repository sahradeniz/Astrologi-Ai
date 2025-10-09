import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  Image,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

const MotionImage = motion(Image);

const storyMock = {
  title: "Serenade of the Seventh House",
  subtitle: "Your relationships bloom in luminous hues.",
  body: `This chapter invites you to harmonize the rhythm between giving and receiving.
  A guardian planet whispers about trust, promising stronger bonds when you share your truth.
  Let this season be a tapestry of connection, woven with empathy and curiosity.`,
  tag: "Relational Glow",
  image:
    "https://images.unsplash.com/photo-1523895665936-7bfe172b757d?auto=format&fit=crop&w=800&q=80",
};

const StoryView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Container maxW="container.md" py={{ base: 10, md: 16 }}>
      <VStack spacing={8} align="stretch">
        <MotionImage
          src={storyMock.image}
          alt={storyMock.title}
          borderRadius="3xl"
          objectFit="cover"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          maxH="360px"
          w="full"
        />
        <Stack spacing={4} color="whiteAlpha.900">
          <Badge
            alignSelf="flex-start"
            borderRadius="full"
            px={4}
            py={1}
            bgGradient="linear(to-r, #FF9A8B, #FF6A88, #FF99AC)"
            color="blackAlpha.800"
          >
            {storyMock.tag}
          </Badge>
          <Heading size="2xl">{storyMock.title}</Heading>
          <Text fontSize="lg" color="whiteAlpha.800">
            {storyMock.subtitle}
          </Text>
          <Box
            bg="rgba(255,255,255,0.12)"
            borderRadius="2xl"
            p={{ base: 5, md: 6 }}
          >
            <Text whiteSpace="pre-line" lineHeight="taller">
              {storyMock.body}
            </Text>
          </Box>
        </Stack>
        <Button
          size="lg"
          alignSelf="center"
          borderRadius="full"
          bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
          color="white"
          px={12}
          onClick={() => navigate("/story-studio")}
        >
          Continue
        </Button>
        <Text fontSize="xs" color="whiteAlpha.600" textAlign="center">
          Viewing story #{id}
        </Text>
      </VStack>
    </Container>
  );
};

export default StoryView;
