import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Tag,
  Text,
  VStack,
  Box,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  Heart,
  Briefcase,
  Sparkles,
  Moon,
  Star,
} from "lucide-react";

const MotionCard = motion(Card);

const CATEGORY_STYLES = {
  love: {
    gradient: "linear(to-r, #ec4899, #8b5cf6)",
    accent: "pink.200",
    icon: Heart,
  },
  career: {
    gradient: "linear(to-r, #f97316, #facc15)",
    accent: "yellow.200",
    icon: Briefcase,
  },
  spiritual: {
    gradient: "linear(to-r, #0ea5e9, #22c55e)",
    accent: "teal.200",
    icon: Sparkles,
  },
  shadow: {
    gradient: "linear(to-r, #64748b, #7c3aed)",
    accent: "purple.200",
    icon: Moon,
  },
};

const InterpretationCard = ({ title, data, variant = "love" }) => {
  if (!data) return null;
  const { gradient, accent, icon: IconComponent } =
    CATEGORY_STYLES[variant] || CATEGORY_STYLES.love;

  return (
    <MotionCard
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      bg="rgba(255,255,255,0.08)"
      borderRadius="2xl"
      p={0}
      overflow="hidden"
      maxW="380px"
      w="full"
      mx="auto"
      backdropFilter="blur(12px)"
      border="1px solid rgba(255,255,255,0.12)"
      shadow="2xl"
    >
      <Box
        bgGradient={
          variant === "love"
            ? "linear(to-r, #EC4899, #8B5CF6)"
            : gradient
        }
        px={6}
        py={5}
      >
        <Stack direction="row" align="center" spacing={3}>
          <Box
            bg="rgba(255,255,255,0.18)"
            borderRadius="full"
            p={2.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {IconComponent ? (
              <IconComponent size={20} color="rgba(255,255,255,0.92)" />
            ) : (
              <Star size={20} color="rgba(255,255,255,0.92)" />
            )}
          </Box>
          <VStack align="flex-start" spacing={1}>
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="widest"
              color="rgba(255,255,255,0.78)"
            >
              {title}
            </Text>
            <Heading size="md" color="white">
              {data.headline}
            </Heading>
          </VStack>
        </Stack>
      </Box>

      <CardBody px={6} py={5}>
        <VStack align="flex-start" spacing={4}>
          <Text color="whiteAlpha.900" lineHeight="taller">
            {data.summary}
          </Text>
          <Text fontStyle="italic" color={accent}>
            {data.advice}
          </Text>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {data.themes?.map((theme) => (
              <Tag
                key={theme}
                variant="subtle"
                bg="rgba(255,255,255,0.12)"
                color="whiteAlpha.900"
                borderRadius="full"
                px={3}
                py={1}
                backdropFilter="blur(6px)"
              >
                {theme}
              </Tag>
            ))}
          </Stack>
        </VStack>
      </CardBody>
    </MotionCard>
  );
};

export default InterpretationCard;
