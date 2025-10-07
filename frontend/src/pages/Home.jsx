import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';

import { requestNatalChart } from '../lib/api.js';

function HomePage() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const showError = (message) => {
    toast({
      title: 'Hata',
      description: message,
      status: 'error',
      position: 'top',
      duration: 4000,
      isClosable: true
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        date: form.date,
        time: form.time,
        city: form.city
      };
      const data = await requestNatalChart(payload);
      setResult(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = form.date && form.time && form.city.trim();

  return (
    <Stack spacing={8}>
      <Box>
        <Heading size="xl" mb={2}>
          Astrologi-AI
        </Heading>
        <Text fontSize="md" color="gray.300">
          Doğum haritanı hesapla ve gezegenlerin konumlarını keşfet.
        </Text>
      </Box>

      <Box
        as="form"
        onSubmit={handleSubmit}
        p={6}
        bg="whiteAlpha.100"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
      >
        <Stack spacing={4}>
          <Heading size="md">Doğum Haritası Hesapla</Heading>

          <FormControl>
            <FormLabel>İsim (opsiyonel)</FormLabel>
            <Input
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Adını yaz"
            />
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Doğum Tarihi</FormLabel>
              <Input
                type="date"
                value={form.date}
                onChange={handleChange('date')}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Doğum Saati</FormLabel>
              <Input
                type="time"
                value={form.time}
                onChange={handleChange('time')}
              />
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired>
            <FormLabel>Doğum Şehri</FormLabel>
            <Input
              value={form.city}
              onChange={handleChange('city')}
              placeholder="Örn. İstanbul, Türkiye"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="teal"
            alignSelf="flex-start"
            isLoading={loading}
            isDisabled={!canSubmit}
          >
            Haritayı Oluştur
          </Button>
        </Stack>
      </Box>

      {result && (
        <Box p={6} bg="whiteAlpha.100" borderRadius="2xl" borderWidth="1px" borderColor="whiteAlpha.200">
          <Stack spacing={4}>
            <Heading size="md">Harita Özeti</Heading>
            <Text fontSize="sm" color="gray.300">
              Zaman dilimi: {result.timezone} • Konum: {result.location?.city}
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {Object.entries(result.planets || {}).map(([planet, details]) => (
                <Box
                  key={planet}
                  p={3}
                  borderRadius="lg"
                  bg="blackAlpha.300"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                >
                  <Text fontWeight="semibold">{planet}</Text>
                  <Text fontSize="sm" color="gray.200">
                    {details.sign} • {details.longitude}° • Ev {details.house}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
            {result?.interpretation && (
              <Box p={4} borderRadius="lg" bg="blackAlpha.400">
                <Heading size="sm" mb={2}>AI Yorum</Heading>
                <Text fontSize="sm" color="gray.100" whiteSpace="pre-wrap">
                  {result.interpretation}
                </Text>
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export default HomePage;
