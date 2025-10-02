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
  birthdate: '',
  birthTime: '',
  birthLocation: ''
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        partners: [
          {
            name: personA.name,
            birthdate: personA.birthdate || null,
            birthTime: personA.birthTime || null,
            birthLocation: personA.birthLocation || null
          },
          {
            name: personB.name,
            birthdate: personB.birthdate || null,
            birthTime: personB.birthTime || null,
            birthLocation: personB.birthLocation || null
          }
        ]
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
    personA.birthdate &&
    personB.name.trim() &&
    personB.birthdate;

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
                onChange={(event) =>
                  setPersonA((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ad"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Doğum Tarihi</FormLabel>
              <Input
                type="date"
                value={personA.birthdate}
                onChange={(event) =>
                  setPersonA((current) => ({ ...current, birthdate: event.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Doğum Saati</FormLabel>
              <Input
                type="time"
                value={personA.birthTime}
                onChange={(event) =>
                  setPersonA((current) => ({ ...current, birthTime: event.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Doğum Yeri</FormLabel>
              <Input
                value={personA.birthLocation}
                onChange={(event) =>
                  setPersonA((current) => ({ ...current, birthLocation: event.target.value }))
                }
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
                onChange={(event) =>
                  setPersonB((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ad"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Doğum Tarihi</FormLabel>
              <Input
                type="date"
                value={personB.birthdate}
                onChange={(event) =>
                  setPersonB((current) => ({ ...current, birthdate: event.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Doğum Saati</FormLabel>
              <Input
                type="time"
                value={personB.birthTime}
                onChange={(event) =>
                  setPersonB((current) => ({ ...current, birthTime: event.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Doğum Yeri</FormLabel>
              <Input
                value={personB.birthLocation}
                onChange={(event) =>
                  setPersonB((current) => ({ ...current, birthLocation: event.target.value }))
                }
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
                    result.interpretation ??
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
