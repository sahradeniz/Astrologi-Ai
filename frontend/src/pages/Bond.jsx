import { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

import { calculateSynastry } from "../lib/api.js";

const MotionBox = motion(Box);

const emptyPerson = { name: "", date: "", time: "", city: "" };

const Bond = () => {
  const [personA, setPersonA] = useState(emptyPerson);
  const [personB, setPersonB] = useState(emptyPerson);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = (setter, field) => (event) => {
    const { value } = event.target;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const disabled =
    !personA.date || !personA.time || !personA.city.trim() ||
    !personB.date || !personB.time || !personB.city.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      const payload = {
        person1: {
          name: personA.name,
          date: personA.date,
          time: personA.time,
          city: personA.city,
        },
        person2: {
          name: personB.name,
          date: personB.date,
          time: personB.time,
          city: personB.city,
        },
      };
      const response = await calculateSynastry(payload);
      setResult(response);
    } catch (error) {
      toast({
        title: "Compatibility signal dropped",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={{ base: 12, md: 16 }}>
      <VStack spacing={10} align="stretch">
        <Heading size="2xl" color="white">
          Bond
        </Heading>
        <MotionBox
          as="form"
          onSubmit={handleSubmit}
          bg="rgba(255,255,255,0.12)"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          boxShadow="2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Stack spacing={6} color="white">
            <Text color="whiteAlpha.800">
              Compare two charts and reveal the chemistry, friction, and harmony in your connection.
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {[{ label: "You", state: personA, setter: setPersonA }, { label: "Their", state: personB, setter: setPersonB }].map(
                ({ label, state, setter }) => (
                  <VStack key={label} spacing={4} align="stretch" bg="rgba(255,255,255,0.08)" borderRadius="2xl" p={4}>
                    <Heading size="sm" color="whiteAlpha.900">
                      {label} Chart
                    </Heading>
                    <FormControl>
                      <FormLabel color="whiteAlpha.900">Name</FormLabel>
                      <Input
                        value={state.name}
                        onChange={handleChange(setter, "name")}
                        placeholder="Amelia"
                        bg="whiteAlpha.200"
                        border="none"
                        _focus={{ bg: "whiteAlpha.300" }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="whiteAlpha.900">Birth Date</FormLabel>
                      <Input
                        type="date"
                        value={state.date}
                        onChange={handleChange(setter, "date")}
                        bg="whiteAlpha.200"
                        border="none"
                        _focus={{ bg: "whiteAlpha.300" }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="whiteAlpha.900">Birth Time</FormLabel>
                      <Input
                        type="time"
                        value={state.time}
                        onChange={handleChange(setter, "time")}
                        bg="whiteAlpha.200"
                        border="none"
                        _focus={{ bg: "whiteAlpha.300" }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="whiteAlpha.900">City</FormLabel>
                      <Input
                        value={state.city}
                        onChange={handleChange(setter, "city")}
                        placeholder="Paris, France"
                        bg="whiteAlpha.200"
                        border="none"
                        _focus={{ bg: "whiteAlpha.300" }}
                      />
                    </FormControl>
                  </VStack>
                )
              )}
            </SimpleGrid>
            <Button
              type="submit"
              alignSelf="flex-start"
              size="lg"
              borderRadius="full"
              bgGradient="linear(to-r, #8E2DE2, #4A00E0)"
              color="white"
              isDisabled={disabled}
              isLoading={loading}
            >
              Calculate compatibility
            </Button>
          </Stack>
        </MotionBox>

        {result && (
          <MotionBox
            bg="rgba(255,255,255,0.18)"
            borderRadius="2xl"
            p={{ base: 6, md: 8 }}
            boxShadow="xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Stack spacing={4} color="white">
              <Heading size="lg">Compatibility Snapshot</Heading>
              <Text whiteSpace="pre-line" lineHeight="taller">
                {result?.ai_interpretation?.summary ||
                  "Your stories intertwine in ways the cosmos is still composing."}
              </Text>
              <Text fontStyle="italic" color="purple.200">
                {result?.ai_interpretation?.advice || "Stay curious about each other."}
              </Text>
            </Stack>
          </MotionBox>
        )}
      </VStack>
    </Container>
  );
};

export default Bond;
