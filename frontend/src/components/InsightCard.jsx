import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Stack,
  Text,
  UnorderedList,
  ListItem,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { sanitize } from "../lib/format.js";

const InsightCard = ({ card, fallbackTitle = "Kozmik Yorum" }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!card) return null;

  const displayTitle = sanitize(card.title) || fallbackTitle;
  const narrativeText = sanitize(card?.narrative?.main);
  const reasons = Array.isArray(card?.reasons?.psychology)
    ? card.reasons.psychology.map((item) => sanitize(item)).filter(Boolean)
    : [];
  const actions = Array.isArray(card?.actions)
    ? card.actions.map((item) => sanitize(item)).filter(Boolean)
    : [];
  const tags = Array.isArray(card?.tags) ? card.tags.map((item) => sanitize(item)).filter(Boolean) : [];
  const confidenceLabel = sanitize(card?.confidence_label);

  const hasDetails = reasons.length > 0 || actions.length > 0;

  return (
    <Box
      borderRadius="28px"
      p={{ base: 5, md: 6 }}
      bg="rgba(255,255,255,0.94)"
      border="1px solid rgba(30,27,41,0.08)"
      boxShadow="0 18px 40px rgba(30,27,41,0.08)"
    >
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Text fontSize="lg" fontWeight="700" color="brand.midnight">
            {displayTitle}
          </Text>
          {narrativeText && (
            <Text color="rgba(30,27,41,0.78)" lineHeight="taller">
              {narrativeText}
            </Text>
          )}
        </Stack>

        {(tags.length > 0 || confidenceLabel) && (
          <Wrap spacing={2}>
            {tags.map((tag) => (
              <WrapItem key={tag}>
                <Badge
                  borderRadius="full"
                  px={3}
                  py={1}
                  bg="rgba(92,107,242,0.1)"
                  color="rgba(30,27,41,0.75)"
                  fontWeight="600"
                >
                  {tag}
                </Badge>
              </WrapItem>
            ))}
            {confidenceLabel && (
              <WrapItem>
                <Badge
                  borderRadius="full"
                  px={3}
                  py={1}
                  bg="rgba(236,72,153,0.12)"
                  color="rgba(190,24,93,0.95)"
                  fontWeight="600"
                >
                  {confidenceLabel}
                </Badge>
              </WrapItem>
            )}
          </Wrap>
        )}

        {hasDetails && (
          <>
            <Button
              variant="ghost"
              size="sm"
              alignSelf="flex-start"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails ? "Nasıl hesaplandığını gizle" : "Nasıl hesaplandı?"}
            </Button>
            <Collapse in={showDetails} animateOpacity>
              <Stack
                spacing={4}
                borderRadius="20px"
                bg="rgba(246,247,251,0.8)"
                border="1px solid rgba(219,225,255,0.8)"
                p={4}
              >
                {reasons.length > 0 && (
                  <Stack spacing={2}>
                    <Text fontSize="sm" fontWeight="600" color="rgba(30,27,41,0.7)">
                      Neden böyle söylüyoruz?
                    </Text>
                    <UnorderedList spacing={1.5} color="rgba(30,27,41,0.72)" fontSize="sm">
                      {reasons.map((reason, index) => (
                        <ListItem key={`${reason}-${index}`}>{reason}</ListItem>
                      ))}
                    </UnorderedList>
                  </Stack>
                )}
                {reasons.length > 0 && actions.length > 0 && (
                  <Divider borderColor="rgba(30,27,41,0.12)" />
                )}
                {actions.length > 0 && (
                  <Stack spacing={2}>
                    <Text fontSize="sm" fontWeight="600" color="rgba(30,27,41,0.7)">
                      Ne yapmalı?
                    </Text>
                    <UnorderedList spacing={1.5} color="rgba(30,27,41,0.72)" fontSize="sm">
                      {actions.map((action, index) => (
                        <ListItem key={`${action}-${index}`}>{action}</ListItem>
                      ))}
                    </UnorderedList>
                  </Stack>
                )}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default InsightCard;
