import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react';

import { requestDailyInsight, requestTransits } from '../lib/api.js';

function HomePage() {
  const toast = useToast();

  const [dailyForm, setDailyForm] = useState({
    name: '',
    birthdate: ''
  });
  const [dailyResult, setDailyResult] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [yearForm, setYearForm] = useState({
    name: '',
    birthdate: '',
    birthTime: '',
    birthLocation: ''
  });
  const [yearResult, setYearResult] = useState(null);
  const [yearLoading, setYearLoading] = useState(false);

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

  const handleDailySubmit = async (event) => {
    event.preventDefault();
    setDailyLoading(true);

    try {
      const payload = {
        name: dailyForm.name,
        birthdate: dailyForm.birthdate || null
      };
      const data = await requestDailyInsight(payload);
      setDailyResult(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setDailyLoading(false);
    }
  };

  const handleYearSubmit = async (event) => {
    event.preventDefault();
    setYearLoading(true);

    try {
      const payload = {
        name: yearForm.name,
        birthdate: yearForm.birthdate || null,
        birthTime: yearForm.birthTime || null,
        birthLocation: yearForm.birthLocation || null,
        scope: 'year'
      };
      const data = await requestTransits(payload);
      setYearResult(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setYearLoading(false);
    }
  };

  return (
    <Stack spacing={10}>
      <Box>
        <Heading size="xl" mb={2}>
          Astrologi-AI
        </Heading>
        <Text fontSize="md" color="gray.300">
          Günlük içgörülerini al, yıldızlardan yıllık rehberini öğren.
        </Text>
      </Box>

      <Stack spacing={6}>
        <Box p={6} bg="whiteAlpha.100" borderRadius="2xl" borderWidth="1px" borderColor="whiteAlpha.200">
          <Stack as="form" spacing={4} onSubmit={handleDailySubmit}>
            <Heading size="md">Günlük İçgörü</Heading>
            <FormControl isRequired>
              <FormLabel>İsim</FormLabel>
              <Input
                value={dailyForm.name}
                onChange={(event) =>
                  setDailyForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Adını yaz"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Doğum Tarihi</FormLabel>
              <Input
                type="date"
                value={dailyForm.birthdate}
                onChange={(event) =>
                  setDailyForm((current) => ({ ...current, birthdate: event.target.value }))
                }
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="teal"
              alignSelf="flex-start"
              isLoading={dailyLoading}
              isDisabled={!dailyForm.name.trim()}
            >
              Günlük Mesajı Al
            </Button>

            {dailyResult && (
              <Box mt={4} p={4} borderRadius="lg" bg="blackAlpha.300">
                <Text fontWeight="medium">Bugünkü Mesajın</Text>
                {dailyResult.zodiacSign && (
                  <Text mt={1} fontSize="sm" color="teal.200">
                    Burcun: {dailyResult.zodiacSign}
                  </Text>
                )}
                <Text mt={3}>{dailyResult.message}</Text>
              </Box>
            )}
          </Stack>
        </Box>

        <Box p={6} bg="whiteAlpha.100" borderRadius="2xl" borderWidth="1px" borderColor="whiteAlpha.200">
          <Stack as="form" spacing={4} onSubmit={handleYearSubmit}>
            <Heading size="md">Yıl Özeti</Heading>
            <Text fontSize="sm" color="gray.300">
              Doğum bilgilerini paylaş, önümüzdeki yıla dair kozmik temalar ortaya çıksın.
            </Text>
            <FormControl isRequired>
              <FormLabel>İsim</FormLabel>
              <Input
                value={yearForm.name}
                onChange={(event) =>
                  setYearForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Adını yaz"
              />
            </FormControl>
            <HStack spacing={4} align="flex-start">
              <FormControl isRequired>
                <FormLabel>Doğum Tarihi</FormLabel>
                <Input
                  type="date"
                  value={yearForm.birthdate}
                  onChange={(event) =>
                    setYearForm((current) => ({ ...current, birthdate: event.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Doğum Saati</FormLabel>
                <Input
                  type="time"
                  value={yearForm.birthTime}
                  onChange={(event) =>
                    setYearForm((current) => ({ ...current, birthTime: event.target.value }))
                  }
                />
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Doğum Yeri</FormLabel>
              <Input
                value={yearForm.birthLocation}
                onChange={(event) =>
                  setYearForm((current) => ({ ...current, birthLocation: event.target.value }))
                }
                placeholder="Örn. İstanbul, Türkiye"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="purple"
              alignSelf="flex-start"
              isLoading={yearLoading}
              isDisabled={!yearForm.name.trim() || !yearForm.birthdate}
            >
              Yıllık İçgörüyü Oluştur
            </Button>

            {yearResult && (
              <Box mt={4} p={4} borderRadius="lg" bg="blackAlpha.300">
                <Text fontWeight="medium" mb={2}>
                  Yıldızlardan Gelen Notlar
                </Text>
                <Textarea
                  value={JSON.stringify(yearResult, null, 2)}
                  isReadOnly
                  height="200px"
                  fontFamily="mono"
                />
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}

export default HomePage;
