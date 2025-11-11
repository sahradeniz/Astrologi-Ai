import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import InterpretationCard from "../components/InterpretationCard.jsx";
import ArchetypeDashboard from "../components/ArchetypeDashboard.jsx";
import LifeNarrativeCard from "../components/LifeNarrativeCard.jsx";
import InsightCard from "../components/InsightCard.jsx";
import { fetchUserProfile, getAlternateNarrative, getInterpretation } from "../lib/api.js";

const MotionBox = motion(Box);

const SunLineIcon = (props) => (
  <Icon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2.5v3" />
    <path d="M12 18.5v3" />
    <path d="M4.22 4.22l2.12 2.12" />
    <path d="M17.66 17.66l2.12 2.12" />
    <path d="M2.5 12h3" />
    <path d="M18.5 12h3" />
    <path d="M4.22 19.78l2.12-2.12" />
    <path d="M17.66 6.34l2.12-2.12" />
  </Icon>
);

const MoonLineIcon = (props) => (
  <Icon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15.5 20A8 8 0 0 1 9 4.5a6.5 6.5 0 1 0 6.5 15.5Z" />
  </Icon>
);

const RisingLineIcon = (props) => (
  <Icon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 20V9" />
    <path d="M7.5 13.5 12 9l4.5 4.5" />
    <path d="M4 20h16" />
  </Icon>
);

const PlacementIcon = ({ type, ...props }) => {
  if (type === "sun") return <SunLineIcon {...props} />;
  if (type === "moon") return <MoonLineIcon {...props} />;
  return <RisingLineIcon {...props} />;
};

const ordinalSuffix = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
};

const Profile = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("userProfile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [chart, setChart] = useState(() => {
    try {
      if (profile?.chart) return profile.chart;
      const stored = localStorage.getItem("userChart");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [categories, setCategories] = useState(null);
  const [archetype, setArchetype] = useState(null);
  const [lifeNarrative, setLifeNarrative] = useState(null);
  const [alternateNarrative, setAlternateNarrative] = useState(null);
  const [insightCards, setInsightCards] = useState(null);
  const [loadingInterpretation, setLoadingInterpretation] = useState(false);
  const [loadingAltNarrative, setLoadingAltNarrative] = useState(false);
  const [interpretationError, setInterpretationError] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("online");

  useEffect(() => {
    if (profile) return;

    let email = null;
    try {
      const storedRaw = localStorage.getItem("userProfile");
      email = storedRaw ? JSON.parse(storedRaw)?.email : null;
    } catch {
      email = null;
    }

    if (!email) return;

    (async () => {
      try {
        const remote = await fetchUserProfile(email);
        if (remote) {
          setProfile(remote);
          localStorage.setItem("userProfile", JSON.stringify(remote));
          if (remote.chart) {
            setChart(remote.chart);
            localStorage.setItem("userChart", JSON.stringify(remote.chart));
          }
        }
        setBackendStatus("online");
      } catch (error) {
        setProfileError(error.message);
        setBackendStatus("offline");
        toast({
          title: "Sunucuya ulaşılamadı",
          description: "Veriler yalnızca yerel olarak kaydedilecek.",
          status: "warning",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
      }
    })();
  }, [profile, toast]);

  useEffect(() => {
    if (!chart || !chart.planets) return;
    (async () => {
      setLoadingInterpretation(true);
      setInterpretationError(null);
      try {
        const response = await getInterpretation(chart);
        setCategories(response?.categories || null);
        setArchetype(response?.archetype || null);
        setInsightCards(response?.cards || null);
        const narrative = response?.life_narrative || response?.archetype?.life_narrative;
        setLifeNarrative(narrative || null);
        setAlternateNarrative(null);
      } catch (error) {
        setInterpretationError(error.message);
        setInsightCards(null);
      } finally {
        setLoadingInterpretation(false);
      }
    })();
  }, [chart]);

  useEffect(() => {
    if (!profileError || backendStatus === "offline") return;
    toast({
      title: "Profil bilgisi bulunamadı",
      description: profileError,
      status: "warning",
      duration: 4000,
      isClosable: true,
      position: "top",
    });
  }, [profileError, backendStatus, toast]);

  if (!profile && !chart) {
    return (
      <Container maxW="container.sm" py={{ base: 16, md: 20 }}>
        <VStack spacing={6} textAlign="center">
          <Heading fontSize={{ base: "2.5rem", md: "3rem" }}>
            Your Cosmic Blueprint
          </Heading>
          <Text color="rgba(30,27,41,0.65)">
            We could not find your cosmic profile yet. Create your chart to begin.
          </Text>
          <Button variant="gradient" as={Link} to="/">
            Start Onboarding
          </Button>
        </VStack>
      </Container>
    );
  }

  const chartData = chart || profile?.chart || {};
  const firstName = profile?.firstName?.trim() || "Stargazer";
  const lastName = profile?.lastName?.trim() || "";
  const displayName = `${firstName} ${lastName}`.trim() || "Stargazer";
  const usernameHandle = displayName.toLowerCase().replace(/\s+/g, "") || "stargazer";

  const sun = chartData?.planets?.Sun || {};
  const moon = chartData?.planets?.Moon || {};
  const ascSign =
    chartData?.angles?.ascendant_sign ||
    chartData?.Ascendant?.sign ||
    null;

  const sunSign = sun.sign || "—";
  const moonSign = moon.sign || "—";
  const sunHouse = sun.house ? ordinalSuffix(sun.house) : null;

  const behaviorCount = useMemo(() => archetype?.behavior_patterns?.length || 0, [archetype]);

  const formattedPlanetPositions = useMemo(() => {
    if (Array.isArray(chartData?.formatted_positions) && chartData.formatted_positions.length) {
      return chartData.formatted_positions;
    }

    const planetOrder = [
      "Sun",
      "Moon",
      "Mercury",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
      "Uranus",
      "Neptune",
      "Pluto",
      "North Node",
      "Lilith",
      "Chiron",
      "Fortune",
      "Vertex",
    ];

    const toDegreeText = (degValue, minuteValue, fallbackLongitude) => {
      let deg = typeof degValue === "number" ? Math.trunc(degValue) : null;
      let minutes = typeof minuteValue === "number" ? Math.round(minuteValue) : null;

      if (deg === null || minutes === null) {
        const lon = typeof fallbackLongitude === "number" ? fallbackLongitude : 0;
        let normalised = ((lon % 360) + 360) % 360;
        deg = Math.floor(normalised);
        minutes = Math.round((normalised - deg) * 60);
      }

      if (minutes >= 60) {
        deg += Math.floor(minutes / 60);
        minutes %= 60;
      }

      return `${deg}°${minutes.toString().padStart(2, "0")}’`;
    };

    return planetOrder
      .filter((name) => chartData?.planets?.[name])
      .map((name) => {
        const details = chartData.planets[name];
        const houseLabel = details.house ? `${ordinalSuffix(details.house)} House` : "Unknown House";
        const retro = details.retrograde ? ", Retrograde" : "";
        return `${name} in ${details.sign || "Unknown"} ${toDegreeText(details.degree, details.minute, details.longitude)}${retro}, in ${houseLabel}`;
      });
  }, [chartData]);

  const formattedHousePositions = useMemo(() => {
    if (Array.isArray(chartData?.formatted_houses) && chartData.formatted_houses.length) {
      return chartData.formatted_houses;
    }

    const houses = chartData?.house_positions || {};
    const toDegreeText = (details) => {
      if (!details) return "0°00’";
      const value = details.longitude ?? 0;
      let normalised = ((value % 360) + 360) % 360;
      let deg = Math.floor(normalised);
      let minutes = Math.round((normalised - deg) * 60);
      if (minutes >= 60) {
        deg += Math.floor(minutes / 60);
        minutes %= 60;
      }
      return `${deg}°${minutes.toString().padStart(2, "0")}’`;
    };

    return Object.keys(houses)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => {
        const details = houses[key];
        return `${ordinalSuffix(Number(key))} House in ${details?.sign || "Unknown"} ${toDegreeText(details)}`;
      });
  }, [chartData]);

  const formattedAspects = useMemo(() => {
    if (Array.isArray(chartData?.formatted_aspects) && chartData.formatted_aspects.length) {
      return chartData.formatted_aspects;
    }

    const aspectAngles = {
      Conjunction: 0,
      Sextile: 60,
      Square: 90,
      Trine: 120,
      Opposition: 180,
    };

    const toOrbText = (aspectName, exact) => {
      const expected = aspectAngles[aspectName];
      if (typeof exact !== "number" || expected === undefined) return null;
      let orb = Math.abs(exact - expected);
      let degrees = Math.floor(orb);
      let minutes = Math.round((orb - degrees) * 60);
      if (minutes >= 60) {
        degrees += 1;
        minutes -= 60;
      }
      return `${degrees}°${minutes.toString().padStart(2, "0")}9`;
    };

    return (chartData?.aspects || []).map((item) => {
      const orbText = toOrbText(item.aspect, item.exact_angle ?? (item.orb ? aspectAngles[item.aspect] + item.orb : undefined));
      return orbText
        ? `${item.planet1} ${item.aspect} ${item.planet2} (Orb: ${orbText})`
        : `${item.planet1} ${item.aspect} ${item.planet2}`;
    });
  }, [chartData]);

  const handleAlternateNarrative = async () => {
    if (!chart) {
      toast({
        title: "Grafik bulunamadı",
        description: "Alternatif yorum üretmek için önce bir doğum haritası oluşturmalısın.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setLoadingAltNarrative(true);
    try {
      const alt = await getAlternateNarrative(chart, "secondary");
      setAlternateNarrative(alt || null);
    } catch (error) {
      toast({
        title: "Alternatif yorum üretilemedi",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoadingAltNarrative(false);
    }
  };

  return (
    <Container maxW="container.lg" py={{ base: 10, md: 14 }}>
      <VStack spacing={{ base: 10, md: 12 }} align="stretch">
        <MotionBox
          position="relative"
          overflow="hidden"
          borderRadius="32px"
          bg="rgba(255,255,255,0.95)"
          px={{ base: 6, md: 10 }}
          py={{ base: 8, md: 10 }}
          boxShadow="aura"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box
            position="absolute"
            inset="-40% 0 auto"
            height="160%"
            bgGradient="radial(at 20% 20%, rgba(92,107,242,0.28), transparent 65%)"
            pointerEvents="none"
          />
          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={{ base: 6, md: 10 }}
            align={{ base: "flex-start", md: "center" }}
            position="relative"
          >
            <Avatar
              name={displayName}
              size="xl"
              bg="brand.blue"
              color="brand.ivory"
              border="4px solid rgba(255,255,255,0.9)"
              boxShadow="0 18px 35px rgba(92,107,242,0.28)"
            />
            <VStack align="flex-start" spacing={2}>
              <Heading fontSize={{ base: "2.5rem", md: "3rem" }}>{displayName}</Heading>
              <Text fontSize="sm" color="rgba(30,27,41,0.55)" letterSpacing="0.3em">
                @{usernameHandle}
              </Text>
              <HStack
                spacing={{ base: 2, md: 3.5 }}
                mt={3}
                align="center"
                flexWrap="nowrap"
                overflowX="auto"
                maxW="100%"
              >
                {[
                  { label: "Sun", sign: sunSign, type: "sun" },
                  { label: "Moon", sign: moonSign, type: "moon" },
                  { label: "Rising", sign: ascSign || "—", type: "rising" },
                ].map(({ label, sign, type }) => (
                  <HStack
                    key={label}
                    spacing={1.5}
                    align="center"
                    borderRadius="full"
                    px={{ base: 2.5, md: 3 }}
                    py={{ base: 1, md: 1.5 }}
                    bg="rgba(92,107,242,0.08)"
                    whiteSpace="nowrap"
                    flexShrink={0}
                  >
                    <PlacementIcon type={type} boxSize={{ base: 4, md: 5 }} color="rgba(30,27,41,0.72)" flexShrink={0} />
                    <Text
                      as="span"
                      fontSize={{ base: "xs", md: "sm" }}
                      color="rgba(30,27,41,0.72)"
                      fontWeight="600"
                      whiteSpace="nowrap"
                    >
                      {label}{" "}
                      <Text
                        as="span"
                        fontWeight="500"
                        color="rgba(30,27,41,0.6)"
                        fontSize="inherit"
                      >
                        {sign || "—"}
                      </Text>
                    </Text>
                  </HStack>
                ))}
              </HStack>
              <Button
                as={Link}
                to="/settings"
                variant="gradient"
                size="sm"
                mt={3}
              >
                Edit profile in Settings
              </Button>
              {behaviorCount > 0 && (
                <Text fontSize="sm" color="rgba(30,27,41,0.6)">
                  {behaviorCount} behaviour pattern mapped to your archetype.
                </Text>
              )}
            </VStack>
          </Stack>
        </MotionBox>
        {insightCards?.life ? (
          <MotionBox
            borderRadius="28px"
            p={{ base: 0, md: 0 }}
            bg="transparent"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <InsightCard card={insightCards.life} fallbackTitle="Hayat Hikayesi" />
          </MotionBox>
        ) : (
          lifeNarrative && <LifeNarrativeCard narrative={lifeNarrative} />
        )}

        <HStack spacing={4} align="center">
          <Tooltip
            label="Önce profil temelleri hesaplanıyor."
            isDisabled={Boolean(lifeNarrative?.axis)}
            placement="top"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAlternateNarrative}
              isLoading={loadingAltNarrative}
              loadingText="Üretiliyor"
              isDisabled={!lifeNarrative || !lifeNarrative?.axis}
              leftIcon={
                <Text as="span" role="img" aria-label="alternatif" fontSize="lg">
                  🌀
                </Text>
              }
            >
              Alternatif bakış
            </Button>
          </Tooltip>
        </HStack>

        {alternateNarrative && (
          <LifeNarrativeCard
            narrative={alternateNarrative}
            title="🌀 Alternatif bakış"
          />
        )}

        <MotionBox
          borderRadius="28px"
          p={{ base: 6, md: 8 }}
          bg="rgba(255,255,255,0.94)"
          boxShadow="soft"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={5}>
            <Heading fontSize="lg">Cosmic Interpretation</Heading>
            {loadingInterpretation && (
              <Text color="rgba(30,27,41,0.55)">Calling in your latest celestial insights…</Text>
            )}
            {interpretationError && (
              <Text color="brand.coral">{interpretationError}</Text>
            )}
            {insightCards ? (
              <Stack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {insightCards.career && (
                    <InsightCard card={insightCards.career} fallbackTitle="İş & Amaç" />
                  )}
                  {insightCards.spiritual && (
                    <InsightCard card={insightCards.spiritual} fallbackTitle="Ruhsal Akış" />
                  )}
                  {insightCards.love && (
                    <InsightCard card={insightCards.love} fallbackTitle="Aşk & İlişkiler" />
                  )}
                  {insightCards.shadow && (
                    <InsightCard card={insightCards.shadow} fallbackTitle="Gölge Çalışması" />
                  )}
                </SimpleGrid>
              </Stack>
            ) : categories ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <InterpretationCard title="Love & Relationships" data={categories.love} variant="love" />
                <InterpretationCard title="Career & Purpose" data={categories.career} variant="career" />
                <InterpretationCard title="Spiritual Growth" data={categories.spiritual} variant="spiritual" />
                <InterpretationCard title="Shadow Integration" data={categories.shadow} variant="shadow" />
              </SimpleGrid>
            ) : (
              !loadingInterpretation &&
              !interpretationError && (
                <Text color="rgba(30,27,41,0.6)">
                  Bugün gökyüzüyle bağlantı kurmak için veriye erişemedik. Birazdan yeniden dene.
                </Text>
              )
            )}
          </Stack>
        </MotionBox>

        <MotionBox
          borderRadius="28px"
          p={{ base: 6, md: 8 }}
          bg="rgba(255,255,255,0.92)"
          boxShadow="soft"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={4}>
            <Heading fontSize="md" textTransform="uppercase" letterSpacing="0.25em" color="rgba(30,27,41,0.65)">
              Planet positions
            </Heading>
            <VStack align="flex-start" spacing={2}>
              {formattedPlanetPositions.map((entry, index) => (
                <Text key={`${entry}-${index}`} color="rgba(30,27,41,0.78)">
                  {entry}
                </Text>
              ))}
            </VStack>
          </Stack>
        </MotionBox>

        <MotionBox
          borderRadius="28px"
          p={{ base: 6, md: 8 }}
          bg="rgba(255,255,255,0.92)"
          boxShadow="soft"
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={4}>
            <Heading fontSize="md" textTransform="uppercase" letterSpacing="0.25em" color="rgba(30,27,41,0.65)">
              House positions
            </Heading>
            <VStack align="flex-start" spacing={2}>
              {formattedHousePositions.map((entry, index) => (
                <Text key={`${entry}-${index}`} color="rgba(30,27,41,0.78)">
                  {entry}
                </Text>
              ))}
            </VStack>
          </Stack>
        </MotionBox>

        <MotionBox
          borderRadius="28px"
          p={{ base: 6, md: 8 }}
          bg="rgba(255,255,255,0.92)"
          boxShadow="soft"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={4}>
            <Heading fontSize="md" textTransform="uppercase" letterSpacing="0.25em" color="rgba(30,27,41,0.65)">
              Planetary aspects
            </Heading>
            <VStack align="flex-start" spacing={2}>
              {formattedAspects.map((entry, index) => (
                <Text key={`${entry}-${index}`} color="rgba(30,27,41,0.78)">
                  {entry}
                </Text>
              ))}
            </VStack>
          </Stack>
        </MotionBox>

        {archetype && (
          <MotionBox
            borderRadius="28px"
            p={{ base: 6, md: 8 }}
            bg="rgba(255,255,255,0.92)"
            boxShadow="soft"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ArchetypeDashboard archetype={archetype} />
          </MotionBox>
        )}
      </VStack>
    </Container>
  );
};

export default Profile;
