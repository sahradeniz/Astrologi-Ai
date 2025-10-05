import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react';

import { requestNatalChart } from '../lib/api.js';

function StoryStudioPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    birthDateTime: '',
    city: '',
    prompt: '',
    tone: 'ilham verici'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        birthDateTime: form.birthDateTime,
        city: form.city,
        prompt: form.prompt,
        tone: form.tone
      };
      const data = await requestNatalChart(payload);
      setResult(data);
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 4000,
        position: 'top',
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = form.birthDateTime && form.city.trim() && form.prompt.trim();

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">Story Studio</Heading>
        <Text fontSize="sm" color="gray.300" mt={1}>
          Doğum haritandan ilham alan kartlar ve hikâyeler oluştur.
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
          <FormControl>
            <FormLabel>İsim (opsiyonel)</FormLabel>
            <Input
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Adını yaz"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Doğum Tarihi ve Saati</FormLabel>
            <Input
              type="datetime-local"
              value={form.birthDateTime}
              onChange={handleChange('birthDateTime')}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Doğum Şehri</FormLabel>
            <Input
              value={form.city}
              onChange={handleChange('city')}
              placeholder="Örn. İzmir, Türkiye"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Hikâye Teması</FormLabel>
            <Input
              value={form.prompt}
              onChange={handleChange('prompt')}
              placeholder="Örn. Yeni başlangıçlar için motive edici kart"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Ton</FormLabel>
            <Input
              value={form.tone}
              onChange={handleChange('tone')}
              placeholder="Örn. ilham verici, romantik, cesur"
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="cyan"
            alignSelf="flex-start"
            isLoading={loading}
            isDisabled={!canSubmit}
          >
            Haritadan İlham Al
          </Button>

          {result && (
            <>
              <Box mt={4} p={4} borderRadius="lg" bg="blackAlpha.300">
                <Text fontWeight="medium" mb={2}>
                  Doğum Haritası Verisi
                </Text>
                <Textarea
                  value={JSON.stringify(result, null, 2)}
                  isReadOnly
                  height="220px"
                  fontFamily="mono"
                />
              </Box>

              {result.interpretation && (
                <Box mt={2} p={4} borderRadius="lg" bg="blackAlpha.400">
                  <Heading size="sm" mb={2}>AI Yorum</Heading>
                  <Text fontSize="sm" color="gray.100" whiteSpace="pre-wrap">
                    {result.interpretation}
                  </Text>
                </Box>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

export default StoryStudioPage;
