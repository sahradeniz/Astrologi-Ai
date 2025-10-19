import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { calculateNatalChart, saveUserProfile } from "../lib/api.js";

const MotionBox = motion(Box);

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  date: "",
  time: "",
  city: "",
};

const Onboarding = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("userChart");
    if (saved) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedCity = form.city.trim();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast({
        title: "Eksik bilgiler",
        description: "Lütfen adını, soyadını ve e-posta adresini gir.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    if (!form.date || !form.time || !trimmedCity) {
      toast({
        title: "Eksik bilgiler",
        description: "Lütfen doğum tarihini, saatini ve şehrini doldur.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    setLoading(true);
    try {
      const formattedDate = form.date ? new Date(form.date).toISOString().split("T")[0] : "";
      const formattedTime = form.time ? form.time.slice(0, 5) : "";
      const payload = {
        ...form,
        date: formattedDate,
        time: formattedTime,
        city: trimmedCity,
      };

      const chart = await calculateNatalChart(payload);
      localStorage.setItem("userChart", JSON.stringify(chart));

      const profileData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        date: formattedDate,
        time: formattedTime,
        city: trimmedCity,
        chart,
      };

      localStorage.setItem("userProfile", JSON.stringify(profileData));
      try {
        await saveUserProfile(profileData);
      } catch (profileError) {
        console.warn("Profile save failed:", profileError);
        toast({
          title: "Profil kaydedilemedi",
          description: profileError.message || "Şu anda verileri buluta kaydedemiyoruz.",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }

      navigate("/home", { replace: true });
    } catch (error) {
      toast({
        title: "Oops!",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.date &&
    form.time &&
    form.city.trim();

  return (
    <Container
      maxW="lg"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <MotionBox
        bgGradient="linear(to-b, rgba(0,31,128,0.9), rgba(163,59,209,0.85))"
        borderRadius="3xl"
        boxShadow="2xl"
        p={{ base: 8, md: 12 }}
        w="full"
        color="white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <VStack spacing={8} align="stretch" as="form" onSubmit={handleSubmit}>
          <VStack spacing={2} align="center">
            <Heading size="3xl" letterSpacing="widest">
              Jovia
            </Heading>
            <Text fontSize="md" color="whiteAlpha.800">
              Know yourself in a fun, cosmic way ✦
            </Text>
          </VStack>

          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel color="whiteAlpha.900">First Name</FormLabel>
              <Input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Amelia"
                bg="whiteAlpha.200"
                border="none"
                _focus={{ bg: "whiteAlpha.300" }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="whiteAlpha.900">Last Name</FormLabel>
              <Input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Stellar"
                bg="whiteAlpha.200"
                border="none"
                _focus={{ bg: "whiteAlpha.300" }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="whiteAlpha.900">Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                bg="whiteAlpha.200"
                border="none"
                _focus={{ bg: "whiteAlpha.300" }}
              />
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.900">Birth Date</FormLabel>
                <Input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  bg="whiteAlpha.200"
                  border="none"
                  _focus={{ bg: "whiteAlpha.300" }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.900">Birth Time</FormLabel>
                <Input
                  name="time"
                  type="time"
                  value={form.time}
                  onChange={handleChange}
                  bg="whiteAlpha.200"
                  border="none"
                  _focus={{ bg: "whiteAlpha.300" }}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl isRequired>
              <FormLabel color="whiteAlpha.900">City</FormLabel>
              <Input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Istanbul, Turkey"
                bg="whiteAlpha.200"
                border="none"
                _focus={{ bg: "whiteAlpha.300" }}
              />
            </FormControl>
          </VStack>

          <Button
            type="submit"
            size="lg"
            borderRadius="full"
            bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
            _hover={{ opacity: 0.9 }}
            color="white"
            isLoading={loading}
            isDisabled={!canSubmit}
          >
            Create My Chart
          </Button>
        </VStack>
      </MotionBox>
    </Container>
  );
};

export default Onboarding;
