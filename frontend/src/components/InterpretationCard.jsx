import {
  Box,
  Card,
  CardBody,
  Heading,
  Stack,
  Tag,
  Text,
  VStack,
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
    accentBg: "rgba(236,72,153,0.12)",
    accentBorder: "rgba(236,72,153,0.24)",
    accentText: "rgba(190,24,93,0.9)",
    icon: Heart,
  },
  career: {
    accentBg: "rgba(249,115,22,0.14)",
    accentBorder: "rgba(249,115,22,0.24)",
    accentText: "rgba(194,65,12,0.9)",
    icon: Briefcase,
  },
  spiritual: {
    accentBg: "rgba(14,165,233,0.14)",
    accentBorder: "rgba(14,165,233,0.24)",
    accentText: "rgba(12,74,110,0.9)",
    icon: Sparkles,
  },
  shadow: {
    accentBg: "rgba(124,58,237,0.14)",
    accentBorder: "rgba(124,58,237,0.24)",
    accentText: "rgba(88,28,135,0.9)",
    icon: Moon,
  },
};

const InterpretationCard = ({ title, data, variant = "love" }) => {
  if (!data) return null;
  const { accentBg, accentBorder, accentText, icon: IconComponent } =
    CATEGORY_STYLES[variant] || CATEGORY_STYLES.love;

  return (
    <MotionCard
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      bg="rgba(255,255,255,0.92)"
      borderRadius="28px"
      p={0}
      overflow="hidden"
      maxW="420px"
      w="full"
      mx="auto"
      backdropFilter="blur(18px)"
      border="1px solid rgba(30,27,41,0.08)"
      boxShadow="0 18px 45px rgba(30,27,41,0.12)"
    >
      <CardBody px={{ base: 5, md: 6 }} py={{ base: 5, md: 6 }}>
        <Stack spacing={5}>
          <Stack direction="row" align="center" spacing={3}>
            <Box
              borderRadius="18px"
              p={2.5}
              bg={accentBg}
              border={`1px solid ${accentBorder}`}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {IconComponent ? (
                <IconComponent size={20} color={accentText} />
              ) : (
                <Star size={20} color={accentText} />
              )}
            </Box>
            <VStack align="flex-start" spacing={1}>
              <Text
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.28em"
                color="rgba(30,27,41,0.6)"
              >
                {title}
              </Text>
              <Heading fontSize="lg" color="brand.midnight">
                {data.headline}
              </Heading>
            </VStack>
          </Stack>

          <Text color="rgba(30,27,41,0.75)" lineHeight="taller">
            {data.summary}
          </Text>

          <Box
            bg={accentBg}
            borderRadius="20px"
            border={`1px solid ${accentBorder}`}
            px={4}
            py={3}
          >
            <Text color={accentText} fontWeight="600">
              {data.advice}
            </Text>
          </Box>

          <Stack direction="row" spacing={2} flexWrap="wrap">
            {data.themes?.map((theme) => (
              <Tag
                key={theme}
                variant="subtle"
                bg="rgba(30,27,41,0.06)"
                color="rgba(30,27,41,0.7)"
                borderRadius="full"
                px={3}
                py={1}
                backdropFilter="blur(4px)"
              >
                {theme}
              </Tag>
            ))}
          </Stack>
        </Stack>
      </CardBody>
    </MotionCard>
  );
};

export default InterpretationCard;
