import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Stack,
  Switch,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { Edit3, X } from "lucide-react";

import { updateUserProfile } from "../lib/api.js";

const formatDateDisplay = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    /* ignore */
  }
  return value;
};

const formatTimeDisplay = (value) => {
  if (!value) return "—";
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    return value;
  }
  try {
    const date = new Date(`1970-01-01T${value}`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    /* ignore */
  }
  return value;
};

const toISODateString = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  return "";
};

const toTimeHHMM = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, "0")}:${match[2]}`;
    }
    try {
      const parsed = new Date(`1970-01-01T${trimmed}`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().substring(11, 16);
      }
    } catch {
      /* ignore */
    }
  }
  return "";
};

const Settings = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("userProfile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [form, setForm] = useState(() => ({
    date: profile?.date || "",
    time: profile?.time || "",
    city: profile?.city || "",
  }));
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      date: profile?.date || "",
      time: profile?.time || "",
      city: profile?.city || "",
    });
  }, [profile]);

  const formattedDate = useMemo(() => formatDateDisplay(profile?.date), [profile]);
  const formattedTime = useMemo(() => formatTimeDisplay(profile?.time), [profile]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = () => {
    setEditMode((prev) => !prev);
  };

  const handleSave = async () => {
    const nextDate = toISODateString(form.date);
    const nextTime = toTimeHHMM(form.time);
    const nextCity = (form.city || "").trim();

    if (!nextDate || !nextTime || !nextCity) {
      toast({
        title: "Eksik bilgiler",
        description: "Doğum tarihi, saati ve şehrini doğru formatta gir.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const updatedProfile = {
      ...(profile || {}),
      date: nextDate,
      time: nextTime,
      city: nextCity,
    };

    setSaving(true);
    try {
      await updateUserProfile(updatedProfile);
      setProfile(updatedProfile);
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      toast({
        title: "Birth details updated",
        description: "Yeni doğum bilgilerin kaydedildi.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setEditMode(false);
    } catch (error) {
      toast({
        title: "Kaydedilemedi",
        description: error.message || "Bir sorun oluştu.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Heading fontSize={{ base: "2.5rem", md: "3rem" }}>Settings</Heading>

      <Card borderRadius="2xl" bg="rgba(255,255,255,0.92)" boxShadow="soft">
        <CardBody>
          <Stack spacing={6}>
            <Heading fontSize="md" letterSpacing="0.22em" textTransform="uppercase" color="rgba(30,27,41,0.6)">
              Notifications
            </Heading>
            <Stack direction="row" align="center" justify="space-between">
              <Text color="rgba(30,27,41,0.7)">Push Notifications</Text>
              <Switch colorScheme="purple" isDisabled defaultChecked />
            </Stack>
            <Stack direction="row" align="center" justify="space-between">
              <Text color="rgba(30,27,41,0.7)">Celestial Soundscapes</Text>
              <Switch colorScheme="purple" isDisabled />
            </Stack>
            <Stack direction="row" align="center" justify="space-between">
              <Text color="rgba(30,27,41,0.7)">Beta Features</Text>
              <Switch colorScheme="purple" isDisabled />
            </Stack>
            <Text color="rgba(30,27,41,0.55)" fontSize="sm">
              More configuration options are on the horizon. Thank you for journeying with Jovia. 🌙
            </Text>
          </Stack>
        </CardBody>
      </Card>

      <Card borderRadius="2xl" bg="rgba(255,255,255,0.95)" boxShadow="soft">
        <CardBody>
          <Stack spacing={6}>
            <HStack justify="space-between" align="center">
              <Box>
                <Heading fontSize="md" letterSpacing="0.22em" textTransform="uppercase" color="rgba(30,27,41,0.6)">
                  Birth details
                </Heading>
                {!editMode && (
                  <Text color="rgba(30,27,41,0.55)" fontSize="sm">
                    Format: YYYY-MM-DD · HH:MM · City
                  </Text>
                )}
              </Box>
              <IconButton
                aria-label={editMode ? "Cancel editing" : "Edit birth details"}
                icon={editMode ? <X size={18} /> : <Edit3 size={18} />}
                variant="ghost"
                onClick={handleToggleEdit}
              />
            </HStack>

            {editMode ? (
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Birth Date</FormLabel>
                  <Input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleInputChange}
                    placeholder="1996-12-28"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Birth Time</FormLabel>
                  <Input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleInputChange}
                    placeholder="07:10"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Birth City</FormLabel>
                  <Input
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="İstanbul"
                  />
                </FormControl>
                <Button
                  alignSelf="flex-start"
                  variant="gradient"
                  onClick={handleSave}
                  isLoading={saving}
                >
                  Save birth details
                </Button>
              </Stack>
            ) : (
              <Stack spacing={3} color="rgba(30,27,41,0.75)">
                <Text><strong>Date:</strong> {formattedDate}</Text>
                <Text><strong>Time:</strong> {formattedTime}</Text>
                <Text><strong>City:</strong> {profile?.city || "—"}</Text>
              </Stack>
            )}
            {!profile && (
              <Text color="rgba(30,27,41,0.55)" fontSize="sm">
                Birth details will appear here after you complete onboarding.
              </Text>
            )}
          </Stack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default Settings;
