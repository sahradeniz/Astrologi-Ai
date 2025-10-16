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
  name: "",
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
    setLoading(true);
    try {
      const chart = await calculateNatalChart(form);
      localStorage.setItem("userChart", JSON.stringify(chart));

      const profileData = {
        name: form.name,
        date: form.date,
        time: form.time,
        city: form.city,
        chart,
      };

      localStorage.setItem("userProfile", JSON.stringify(profileData));
      try {
        await saveUserProfile(profileData);
      } catch (profileError) {
        console.warn("Profile save failed:", profileError);
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

  const canSubmit = form.date && form.time && form.city.trim();

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
            <FormControl>
              <FormLabel color="whiteAlpha.900">Your Name (optional)</FormLabel>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Amelia"
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
