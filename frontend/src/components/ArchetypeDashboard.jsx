import PropTypes from "prop-types";
import { Box, SimpleGrid, Text, VStack } from "@chakra-ui/react";

const ArchetypeDashboard = ({ archetype }) => {
  const themes = archetype?.core_themes || [];
  const behaviorPatterns = archetype?.behavior_patterns || [];
  const storyTone = archetype?.story_tone || "";
  const lifeExpression = archetype?.life_expression || "";
  const lifeFocus = archetype?.life_focus || "";

  return (
    <VStack spacing={5} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Box
          bgGradient="linear(to-r, purple.500, blue.500)"
          p={4}
          rounded="2xl"
          shadow="xl"
          color="white"
        >
          <Text fontWeight="bold" mb={2}>
            🧠 Archetype DNA
          </Text>
          <Text fontSize="sm" mb={2}>
            {themes.length ? themes.join(", ") : "Temalar beklemede."}
          </Text>
          <Text fontSize="sm" color="whiteAlpha.800">
            {storyTone || "Cosmic tone is tuning in."}
          </Text>
        </Box>

        <Box
          bgGradient="linear(to-r, orange.400, red.400)"
          p={4}
          rounded="2xl"
          shadow="xl"
          color="white"
        >
          <Text fontWeight="bold" mb={2}>
            🜂 Behavior Pattern Map
          </Text>
          {behaviorPatterns.length ? (
            <VStack align="flex-start" spacing={2}>
              {behaviorPatterns.map((pattern, index) => (
                <Text key={`${pattern.pattern}-${index}`} fontSize="sm">
                  • {pattern.pattern} — {pattern.expression}
                </Text>
              ))}
            </VStack>
          ) : (
            <Text fontSize="sm">Yakın zamanda keşfedilecek davranış motifleri.</Text>
          )}
        </Box>

        <Box
          bgGradient="linear(to-r, pink.300, violet.500)"
          p={4}
          rounded="2xl"
          shadow="xl"
          color="white"
        >
          <Text fontWeight="bold" mb={2}>
            💎 Life Narrative
          </Text>
          <Text fontSize="sm" mb={2}>
            {lifeExpression || "Kozmik hikâye henüz şekilleniyor."}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.800">
            {lifeFocus || "Odağını kalbin belirlesin."}
          </Text>
        </Box>
      </SimpleGrid>
    </VStack>
  );
};

ArchetypeDashboard.propTypes = {
  archetype: PropTypes.shape({
    core_themes: PropTypes.arrayOf(PropTypes.string),
    story_tone: PropTypes.string,
    behavior_patterns: PropTypes.arrayOf(
      PropTypes.shape({
        pattern: PropTypes.string,
        expression: PropTypes.string,
      })
    ),
    life_expression: PropTypes.string,
    life_focus: PropTypes.string,
  }),
};

export default ArchetypeDashboard;
