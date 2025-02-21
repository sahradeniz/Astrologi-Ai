import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Button,
  Progress,
  Badge,
  HStack,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FaRobot,
  FaFileUpload,
  FaChartLine,
  FaTrash,
  FaDownload,
  FaLightbulb,
} from 'react-icons/fa';

const AIStats = () => {
  const bgColor = useColorModeValue('white', 'gray.700');

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
      <Box p={6} bg={bgColor} borderRadius="lg" shadow="md">
        <Stat>
          <StatLabel>Toplam Yorum</StatLabel>
          <StatNumber>2,845</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            23% artış
          </StatHelpText>
        </Stat>
      </Box>
      
      <Box p={6} bg={bgColor} borderRadius="lg" shadow="md">
        <Stat>
          <StatLabel>Bilgi Tabanı</StatLabel>
          <StatNumber>15 MB</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            5 yeni dosya
          </StatHelpText>
        </Stat>
      </Box>
      
      <Box p={6} bg={bgColor} borderRadius="lg" shadow="md">
        <Stat>
          <StatLabel>Doğruluk Oranı</StatLabel>
          <StatNumber>94.3%</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            2.1% artış
          </StatHelpText>
        </Stat>
      </Box>
    </SimpleGrid>
  );
};

const KnowledgeBase = () => {
  const [files, setFiles] = useState([]);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    // Fetch uploaded files
    fetch('http://localhost:5003/get_knowledge_files')
      .then(res => res.json())
      .then(data => setFiles(data))
      .catch(err => console.error('Error fetching files:', err));
  }, []);

  const handleDelete = async (filename) => {
    try {
      const response = await fetch('http://localhost:5003/delete_knowledge_file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        setFiles(files.filter(file => file.name !== filename));
        toast({
          title: "Dosya silindi",
          status: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Dosya silinirken bir hata oluştu",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" shadow="md">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Dosya Adı</Th>
            <Th>Boyut</Th>
            <Th>Yüklenme Tarihi</Th>
            <Th>Durum</Th>
            <Th>İşlemler</Th>
          </Tr>
        </Thead>
        <Tbody>
          {files.map((file) => (
            <Tr key={file.name}>
              <Td>{file.name}</Td>
              <Td>{(file.size / 1024).toFixed(2)} KB</Td>
              <Td>{new Date(file.uploaded_at).toLocaleDateString()}</Td>
              <Td>
                <Badge colorScheme={file.processed ? "green" : "yellow"}>
                  {file.processed ? "İşlendi" : "İşleniyor"}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <IconButton
                    icon={<FaDownload />}
                    size="sm"
                    aria-label="Download file"
                    onClick={() => window.open(`http://localhost:5003/download_file/${file.name}`)}
                  />
                  <IconButton
                    icon={<FaTrash />}
                    size="sm"
                    colorScheme="red"
                    aria-label="Delete file"
                    onClick={() => handleDelete(file.name)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

const Suggestions = () => {
  const bgColor = useColorModeValue('white', 'gray.700');
  
  const suggestions = [
    {
      title: "Burç Yorumları",
      description: "Günlük, haftalık ve aylık burç yorumları için kaynak ekleyin.",
      priority: "Yüksek"
    },
    {
      title: "Gezegen Transitler",
      description: "Gezegen transitleri ve etkileri hakkında detaylı bilgiler.",
      priority: "Orta"
    },
    {
      title: "Astrolojik Evler",
      description: "12 astrolojik ev ve anlamları hakkında kapsamlı bilgiler.",
      priority: "Düşük"
    }
  ];

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
      {suggestions.map((suggestion, index) => (
        <Box key={index} p={6} bg={bgColor} borderRadius="lg" shadow="md">
          <HStack spacing={4} mb={4}>
            <Icon as={FaLightbulb} color="yellow.500" boxSize={6} />
            <Heading size="md">{suggestion.title}</Heading>
          </HStack>
          <Text mb={4}>{suggestion.description}</Text>
          <Badge colorScheme={
            suggestion.priority === "Yüksek" ? "red" :
            suggestion.priority === "Orta" ? "yellow" : "green"
          }>
            {suggestion.priority} Öncelik
          </Badge>
        </Box>
      ))}
    </SimpleGrid>
  );
};

const AIManagementPage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <Box textAlign="center" w="full">
            <HStack justify="center" mb={4}>
              <Icon as={FaRobot} boxSize={8} color="purple.500" />
              <Heading>Yapay Zeka Yönetimi</Heading>
            </HStack>
            <Text color="gray.600">
              Astroloji AI'ın bilgi tabanını ve performansını yönetin
            </Text>
          </Box>

          <Tabs variant="enclosed" width="full">
            <TabList>
              <Tab>İstatistikler</Tab>
              <Tab>Bilgi Tabanı</Tab>
              <Tab>Öneriler</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <AIStats />
              </TabPanel>
              <TabPanel>
                <KnowledgeBase />
              </TabPanel>
              <TabPanel>
                <Suggestions />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
};

export default AIManagementPage;
