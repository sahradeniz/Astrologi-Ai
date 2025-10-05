import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  List,
  ListIcon,
  ListItem,
  SimpleGrid,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

import { requestSynastryReport } from '../lib/api.js';

const emptyPerson = {
  name: '',
  birthDateTime: '',
  city: ''
};

function BondPage() {
  const toast = useToast();
  const [personA, setPersonA] = useState(emptyPerson);
  const [personB, setPersonB] = useState(emptyPerson);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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

  const handlePersonChange = (setter, field) => (event) => {
    const { value } = event.target;
    setter((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        person1: {
          name: personA.name,
          birthDateTime: personA.birthDateTime,
          city: personA.city
        },
        person2: {
          name: personB.name,
          birthDateTime: personB.birthDateTime,
          city: personB.city
        }
      };

      const data = await requestSynastryReport(payload);
      setResult(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    personA.name.trim() &&
    personA.birthDateTime &&
    personA.city.trim() &&
    personB.name.trim() &&
    personB.birthDateTime &&
    personB.city.trim();

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">Bond</Heading>
        <Text fontSize="sm" color="gray.300" mt={1}>
          İki kişinin doğum bilgilerini paylaş, kozmik uyumu keşfet.
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
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Stack spacing={3}>
            <Heading size="sm">Kişi A</Heading>
            <FormControl isRequired>
              <FormLabel>İsim</FormLabel>
              <Input
                value={personA.name}
                onChange={handlePersonChange(setPersonA, 'name')}
                placeholder="Ad"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Doğum Tarihi ve Saati</FormLabel>
              <Input
                type="datetime-local"
                value={personA.birthDateTime}
                onChange={handlePersonChange(setPersonA, 'birthDateTime')}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Doğum Şehri</FormLabel>
              <Input
                value={personA.city}
                onChange={handlePersonChange(setPersonA, 'city')}
                placeholder="Örn. Ankara, Türkiye"
              />
            </FormControl>
          </Stack>

          <Stack spacing={3}>
            <Heading size="sm">Kişi B</Heading>
            <FormControl isRequired>
              <FormLabel>İsim</FormLabel>
              <Input
                value={personB.name}
                onChange={handlePersonChange(setPersonB, 'name')}
                placeholder="Ad"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Doğum Tarihi ve Saati</FormLabel>
              <Input
                type="datetime-local"
                value={personB.birthDateTime}
                onChange={handlePersonChange(setPersonB, 'birthDateTime')}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Doğum Şehri</FormLabel>
              <Input
                value={personB.city}
                onChange={handlePersonChange(setPersonB, 'city')}
                placeholder="Örn. İzmir, Türkiye"
              />
            </FormControl>
          </Stack>
        </SimpleGrid>

        <Button
          type="submit"
          mt={8}
          colorScheme="pink"
          isLoading={loading}
          isDisabled={!canSubmit}
        >
          Uyumu Hesapla
        </Button>

        {result && (
          <Card mt={6} bg="blackAlpha.300" borderWidth="1px" borderColor="whiteAlpha.200">
            <CardHeader>
              <Stack direction="row" align="center" justify="space-between">
                <Box>
                  <Heading size="md">Kozmik Uyum Özeti</Heading>
                  <Text fontSize="sm" color="gray.300">
                    Partnerlerin enerjileri nasıl örtüşüyor?
                  </Text>
                </Box>
                {(() => {
                  const score =
                    result.score ??
                    result.compatibilityScore ??
                    result.matchScore ??
                    result.percentage ??
                    null;
                  if (score === null || score === undefined) {
                    return null;
                  }
                  const numericScore = Number(score);
                  const formatted = Number.isFinite(numericScore)
                    ? `${numericScore.toFixed(0)} / 100`
                    : String(score);
                  return (
                    <Badge colorScheme="teal" fontSize="0.8rem" px={3} py={1} borderRadius="full">
                      Uyum Skoru: {formatted}
                    </Badge>
                  );
                })()}
              </Stack>
            </CardHeader>
            <Divider borderColor="whiteAlpha.300" />
            <CardBody>
              <Stack spacing={4}>
                {(() => {
                  const summary =
                    result.summary ??
                    result.description ??
                    result.overview ??
                    null;
                  if (!summary) {
                    return null;
                  }
                  return (
                    <Text fontSize="sm" color="gray.100" whiteSpace="pre-wrap">
                      {summary}
                    </Text>
                  );
                })()}
                {Array.isArray(result.aspects) && result.aspects.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={2} color="purple.200">
                      Açı Listesi
                    </Text>
                    <List spacing={2} fontSize="sm" color="gray.100">
                      {result.aspects.map((aspect, index) => (
                        <ListItem key={`${aspect.planet1}-${aspect.planet2}-${index}`}>
                          {aspect.planet1} &amp; {aspect.planet2}: {aspect.aspect} (orb {aspect.orb}°)
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {result.interpretation && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={2} color="purple.200">
                      AI Yorum
                    </Text>
                    <Text fontSize="sm" color="gray.100" whiteSpace="pre-wrap">
                      {result.interpretation}
                    </Text>
                  </Box>
                )}

                {(() => {
                  const explanations =
                    (Array.isArray(result.explanations) && result.explanations) ||
                    (Array.isArray(result.highlights) && result.highlights) ||
                    (Array.isArray(result.notes) && result.notes) ||
                    null;
                  if (!explanations || explanations.length === 0) {
                    return null;
                  }
                  return (
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2} color="teal.200">
                        Öne Çıkanlar
                      </Text>
                      <List spacing={2} fontSize="sm" color="gray.100">
                        {explanations.map((item, index) => (
                          <ListItem key={`${item}-${index}`} display="flex" gap={2} alignItems="flex-start">
                            <ListIcon as={CheckCircleIcon} color="teal.300" mt={1} />
                            <Text whiteSpace="pre-wrap">{item}</Text>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  );
                })()}

                {(() => {
                  const extra = { ...result };
                  delete extra.score;
                  delete extra.compatibilityScore;
                  delete extra.matchScore;
                  delete extra.percentage;
                  delete extra.summary;
                  delete extra.description;
                  delete extra.interpretation;
                  delete extra.overview;
                  delete extra.explanations;
                  delete extra.highlights;
                  delete extra.notes;
                  delete extra.person1;
                  delete extra.person2;
                  delete extra.aspects;
                  if (Object.keys(extra).length === 0) {
                    return null;
                  }
                  return (
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.300">
                        Detaylar
                      </Text>
                      <Box
                        as="pre"
                        fontSize="xs"
                        bg="blackAlpha.400"
                        borderRadius="md"
                        p={3}
                        whiteSpace="pre-wrap"
                      >
                        {JSON.stringify(extra, null, 2)}
                      </Box>
                    </Box>
                  );
                })()}
              </Stack>
            </CardBody>
          </Card>
        )}
      </Box>
    </Stack>
  );
}

export default BondPage;
