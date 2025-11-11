import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  HStack,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { sanitize } from "../lib/format.js";

const formatConfidence = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  const percentage = Math.round(Math.min(1, value) * 100);
  return `${percentage}% güven`;
};

const LifeNarrativeCard = ({ narrative, title = "💎 Life Narrative" }) => {
  const [showMeta, setShowMeta] = useState(false);
  const axis = sanitize(narrative?.axis) || "—";
  const focus = sanitize(narrative?.focus) || "—";
  const themes = Array.isArray(narrative?.themes) ? narrative.themes.map((item) => sanitize(item)).filter(Boolean) : [];
  const derived = Array.isArray(narrative?.derived_from) ? narrative.derived_from : [];
  const confidenceLabel = formatConfidence(narrative?.confidence);

  return (
    <Box
      borderRadius="28px"
      p={{ base: 6, md: 8 }}
      bg="rgba(255,255,255,0.95)"
      boxShadow="soft"
    >
      <Stack spacing={4}>
        <Text fontWeight="700" fontSize="lg">
          {title}
        </Text>
        <Text color="rgba(30,27,41,0.78)" whiteSpace="pre-wrap" lineHeight="taller">
          {sanitize(narrative?.text) || "—"}
        </Text>
        <HStack spacing={3} flexWrap="wrap">
          <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
            Eksen: {axis}
          </Badge>
          <Badge colorScheme="pink" borderRadius="full" px={3} py={1}>
            Odak: {focus}
          </Badge>
          {confidenceLabel && (
            <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
              {confidenceLabel}
            </Badge>
          )}
        </HStack>
        <Button
          onClick={() => setShowMeta((prev) => !prev)}
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
        >
          {showMeta ? "Kaynakları gizle" : "Nasıl hesaplandı?"}
        </Button>
        <Collapse in={showMeta} animateOpacity>
          <Stack spacing={4} bg="rgba(246,247,251,0.7)" borderRadius="20px" p={4}
            border="1px solid rgba(219,225,255,0.7)">
            <Box>
              <Text fontWeight="600" fontSize="sm" color="rgba(30,27,41,0.65)" mb={2}>
                Temalar
              </Text>
              {themes.length ? (
                <Wrap spacing={2}>
                  {themes.map((theme) => (
                    <WrapItem key={theme}>
                      <Badge
                        variant="subtle"
                        colorScheme="purple"
                        borderRadius="lg"
                        px={3}
                        py={1}
                      >
                        {theme}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              ) : (
                <Text fontSize="sm" color="rgba(30,27,41,0.55)">
                  Tema verisi bulunamadı.
                </Text>
              )}
            </Box>
            <Divider borderColor="rgba(30,27,41,0.08)" />
            <Box>
              <Text fontWeight="600" fontSize="sm" color="rgba(30,27,41,0.65)" mb={2}>
                Kaynak açı/gezegen çiftleri
              </Text>
              {derived.length ? (
                <VStack align="flex-start" spacing={1} fontSize="sm" color="rgba(30,27,41,0.7)">
                  {derived.slice(0, 8).map((item, index) => (
                    <Text key={`${item.pair}-${index}`}>
                      {sanitize(item.pair) || "—"} • {sanitize(item.aspect) || "—"}
                      {typeof item.orb === "number" ? ` • orb ${item.orb}°` : ""}
                    </Text>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="rgba(30,27,41,0.55)">
                  Kaynak açı verisi sağlanmadı.
                </Text>
              )}
            </Box>
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
};

export default LifeNarrativeCard;
