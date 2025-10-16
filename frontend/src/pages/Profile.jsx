import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import InterpretationCard from "../components/InterpretationCard.jsx";
import { fetchUserProfile, getInterpretation, updateUserProfile } from "../lib/api.js";
import ArchetypeDashboard from "../components/ArchetypeDashboard.jsx";

const MotionBox = motion(Box);

const signs = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const ordinalSuffix = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "?";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
};

const degreeToSign = (degree) => {
  if (typeof degree !== "number") return null;
  const index = Math.floor(((degree % 360) + 360) % 360 / 30);
  return signs[index] || null;
};

const Profile = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem("userProfile");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [chart, setChart] = useState(() => {
    try {
      if (profile?.chart) return profile.chart;
      const storedChart = localStorage.getItem("userChart");
      return storedChart ? JSON.parse(storedChart) : null;
    } catch {
      return null;
    }
  });
  const [categories, setCategories] = useState(null);
  const [archetype, setArchetype] = useState(null);
  const [loadingInterpretation, setLoadingInterpretation] = useState(false);
  const [interpretationError, setInterpretationError] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) return;

    (async () => {
      try {
        const remote = await fetchUserProfile();
        if (remote) {
          setProfile(remote);
          localStorage.setItem("userProfile", JSON.stringify(remote));
          if (remote.chart) {
            setChart(remote.chart);
            localStorage.setItem("userChart", JSON.stringify(remote.chart));
          }
        }
      } catch (error) {
        setProfileError(error.message);
      }
    })();
  }, [profile]);

  useEffect(() => {
    if (!chart || !chart.planets) return;

    (async () => {
      setLoadingInterpretation(true);
      setInterpretationError(null);
      try {
        const response = await getInterpretation(chart);
        setCategories(response?.categories || null);
        setArchetype(response?.archetype || null);
      } catch (error) {
        setInterpretationError(error.message);
      } finally {
        setLoadingInterpretation(false);
      }
    })();
  }, [chart]);

  useEffect(() => {
    if (!profileError) return;
    toast({
      title: "Profile not found",
      description: profileError,
      status: "warning",
      duration: 4000,
      isClosable: true,
      position: "top",
    });
  }, [profileError, toast]);

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({ ...prev, ...profile }));
    }
  }, [profile]);

  if (!profile && !chart) {
    return (
      <Container maxW="container.sm" py={{ base: 16, md: 20 }}>
        <VStack spacing={6} textAlign="center" color="white">
          <Heading size="lg">Profile</Heading>
          <Text>We could not find your cosmic profile yet. Create your chart to begin.</Text>
        </VStack>
      </Container>
    );
  }

  const chartData = chart || profile?.chart || {};
  const currentProfileDetails = editMode ? form : profile;
  const sun = chartData?.planets?.Sun || {};
  const moon = chartData?.planets?.Moon || {};
  const sunHouse = ordinalSuffix(sun.house);
  const ascDegree = chartData?.angles?.ascendant;
  const ascSign =
    chartData?.angles?.ascendant_sign ||
    chartData?.Ascendant?.sign ||
    degreeToSign(typeof ascDegree === "number" ? ascDegree : Number.NaN) ||
    "—";

  const sunSign = sun.sign || "—";
  const moonSign = moon.sign || "—";
  const bigThreeLine = `${sunSign} ☀ — ${moonSign} 🌙 — ASC ${ascSign}`;

  const username = (editMode ? form?.name : profile?.name) || chartData?.name || "stargazer";
  const profileSubtitle = [currentProfileDetails?.date, currentProfileDetails?.time, currentProfileDetails?.city]
    .filter(Boolean)
    .join(" · ");

  const summary = [
    `☀ Sun: ${sunSign} (${sunHouse !== "?" ? `${sunHouse} house` : "house unknown"})`,
    `🌙 Moon: ${moonSign}`,
    `ASC: ${ascSign}`,
  ];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = () => {
    setEditMode((prev) => {
      if (prev) {
        setForm(profile || {});
      }
      return !prev;
    });
  };

  const handleSave = async () => {
    const updatedProfile = {
      ...(profile || {}),
      ...form,
      chart: chartData,
    };
    setSaving(true);
    try {
      await updateUserProfile(updatedProfile);
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      toast({
        title: "Profil güncellendi",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setEditMode(false);
    } catch (error) {
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      toast({
        title: "Profil yerel olarak güncellendi",
        description: `Sunucuya kaydedilemedi: ${error.message}`,
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setSaving(false);
    }
  };

  const behaviorCount = useMemo(() => archetype?.behavior_patterns?.length || 0, [archetype]);

  return (
    <Container maxW="container.lg" py={{ base: 12, md: 16 }}>
      <VStack spacing={10} align="stretch">
        <MotionBox
          bgGradient="linear(to-br, rgba(138,92,255,0.45), rgba(45,15,104,0.85))"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          boxShadow="2xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          color="white"
        >
          <VStack spacing={4} align="stretch">
            <Stack direction={{ base: "column", md: "row" }} spacing={6} align={{ base: "center", md: "flex-start" }}>
              <Avatar
                name={username}
                size="xl"
                border="4px solid rgba(255,255,255,0.6)"
                bg="rgba(0,0,0,0.2)"
              />
              <VStack align={{ base: "center", md: "flex-start" }} spacing={2}>
                <Heading size="lg">@{username.toLowerCase()}</Heading>
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                  SOLAR MYSTIC · {behaviorCount} pattern
                </Badge>
                <Text fontSize="sm" color="whiteAlpha.800">
                  {profileSubtitle || "Birth details pending"}
                </Text>
                <Text fontWeight="medium">{bigThreeLine}</Text>
              </VStack>
            </Stack>
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={4}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
            >
              <VStack align="stretch" spacing={3} flex="1">
                {editMode ? (
                  <>
                    <FormControl>
                      <FormLabel color="whiteAlpha.800">İsim</FormLabel>
                      <Input
                        name="name"
                        value={form?.name || ""}
                        onChange={handleInputChange}
                        placeholder="Adın"
                        bg="rgba(255,255,255,0.1)"
                        border="none"
                        _focus={{ bg: "rgba(255,255,255,0.2)" }}
                      />
                    </FormControl>
                    <Stack direction={{ base: "column", md: "row" }} spacing={3}>
                      <FormControl>
                        <FormLabel color="whiteAlpha.800">Doğum Tarihi</FormLabel>
                        <Input
                          name="date"
                          value={form?.date || ""}
                          onChange={handleInputChange}
                          placeholder="1996-12-28"
                          bg="rgba(255,255,255,0.1)"
                          border="none"
                          _focus={{ bg: "rgba(255,255,255,0.2)" }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel color="whiteAlpha.800">Doğum Saati</FormLabel>
                        <Input
                          name="time"
                          value={form?.time || ""}
                          onChange={handleInputChange}
                          placeholder="07:10"
                          bg="rgba(255,255,255,0.1)"
                          border="none"
                          _focus={{ bg: "rgba(255,255,255,0.2)" }}
                        />
                      </FormControl>
                    </Stack>
                    <FormControl>
                      <FormLabel color="whiteAlpha.800">Doğum Şehri</FormLabel>
                      <Input
                        name="city"
                        value={form?.city || ""}
                        onChange={handleInputChange}
                        placeholder="İstanbul"
                        bg="rgba(255,255,255,0.1)"
                        border="none"
                        _focus={{ bg: "rgba(255,255,255,0.2)" }}
                      />
                    </FormControl>
                  </>
                ) : (
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="md" color="whiteAlpha.900">
                      {currentProfileDetails?.name || "İsimsiz kahraman"}
                    </Text>
                    <Text fontSize="sm" color="whiteAlpha.800">
                      {profileSubtitle || "Doğum bilgilerini düzenleyebilirsin."}
                    </Text>
                  </VStack>
                )}
              </VStack>
              <Stack direction="row" spacing={3}>
                <Button
                  variant="outline"
                  borderColor="whiteAlpha.800"
                  color="white"
                  onClick={handleToggleEdit}
                >
                  {editMode ? "Vazgeç" : "Profili Düzenle ✏️"}
                </Button>
                {editMode && (
                  <Button
                    colorScheme="purple"
                    bgGradient="linear(to-r, purple.400, pink.400)"
                    onClick={handleSave}
                    isLoading={saving}
                  >
                    Kaydet
                  </Button>
                )}
              </Stack>
            </Stack>
            <Divider borderColor="whiteAlpha.400" />
            <VStack align="flex-start" spacing={1}>
              {summary.map((line, idx) => (
                <Text key={idx} fontSize="sm" color="whiteAlpha.900">
                  {line}
                </Text>
              ))}
            </VStack>
          </VStack>
        </MotionBox>

        <MotionBox
          bg="rgba(255,255,255,0.12)"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          boxShadow="xl"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          color="white"
        >
          <Stack spacing={4}>
            <Heading size="md">Cosmic Interpretation 🪐</Heading>
            {loadingInterpretation && <Text color="whiteAlpha.700">Loading your cosmic insights...</Text>}
            {interpretationError && <Text color="red.300">{interpretationError}</Text>}
            {categories ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <InterpretationCard title="Love & Relationships" data={categories.love} variant="love" />
                <InterpretationCard title="Career & Purpose" data={categories.career} variant="career" />
                <InterpretationCard title="Spiritual Growth" data={categories.spiritual} variant="spiritual" />
                <InterpretationCard title="Shadow Integration" data={categories.shadow} variant="shadow" />
              </SimpleGrid>
            ) : (
              !loadingInterpretation &&
              !interpretationError && (
                <Text color="whiteAlpha.700">
                  We are calling in your celestial insights. Refresh soon for the latest download.
                </Text>
              )
            )}
          </Stack>
        </MotionBox>

        <MotionBox
          bg="rgba(255,255,255,0.16)"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          color="white"
        >
          <Stack spacing={4}>
            <Heading size="md">Planetary Snapshot</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {Object.entries(chartData.planets || {}).map(([planet, details]) => (
                <Box
                  key={planet}
                  borderRadius="lg"
                  bg="rgba(0,0,0,0.25)"
                  p={4}
                  border="1px solid rgba(255,255,255,0.12)"
                >
                  <Text fontWeight="semibold">{planet}</Text>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    {details.sign || "—"} • {details.longitude}° • House {details.house || "?"}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </MotionBox>

        {archetype && (
          <MotionBox
            bg="rgba(255,255,255,0.18)"
            borderRadius="2xl"
            p={{ base: 6, md: 8 }}
            initial={{ opacity: 0, y: 26 }}
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
