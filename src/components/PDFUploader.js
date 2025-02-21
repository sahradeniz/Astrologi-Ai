import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  VStack,
  Progress,
  Icon,
  HStack,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FaUpload, FaFile, FaCheckCircle } from 'react-icons/fa';

const PDFUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      setSelectedFile(file);
    } else {
      toast({
        title: 'Hata',
        description: 'Lütfen sadece PDF veya TXT dosyası yükleyin.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir dosya seçin.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:5003/upload_file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: data.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setSelectedFile(null);
      } else {
        throw new Error(data.error || 'Dosya yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor}>
      <VStack spacing={6}>
        <Box textAlign="center" w="100%">
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Dosya Yükle
          </Text>
          <Text color="gray.600">
            Astrolojik yorumlar içeren PDF veya TXT dosyalarını yükleyerek sistemin bilgi tabanını genişletebilirsiniz.
          </Text>
        </Box>

        <List spacing={3} w="100%">
          <ListItem>
            <HStack>
              <ListIcon as={FaCheckCircle} color="green.500" />
              <Text>PDF veya TXT formatında dosyalar</Text>
            </HStack>
          </ListItem>
          <ListItem>
            <HStack>
              <ListIcon as={FaCheckCircle} color="green.500" />
              <Text>Gezegen açıları ve yorumları içeren metinler</Text>
            </HStack>
          </ListItem>
          <ListItem>
            <HStack>
              <ListIcon as={FaCheckCircle} color="green.500" />
              <Text>Türkçe veya İngilizce içerik</Text>
            </HStack>
          </ListItem>
        </List>

        <FormControl>
          <FormLabel>Dosya Seç</FormLabel>
          <Input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileSelect}
            disabled={isUploading}
            hidden
            id="file-upload"
          />
          <Button
            as="label"
            htmlFor="file-upload"
            colorScheme="gray"
            leftIcon={<Icon as={FaFile} />}
            w="100%"
            cursor="pointer"
            mb={4}
          >
            {selectedFile ? selectedFile.name : 'Dosya Seç'}
          </Button>
        </FormControl>

        {isUploading && <Progress size="xs" isIndeterminate w="100%" />}

        <Button
          colorScheme="purple"
          onClick={handleUpload}
          isLoading={isUploading}
          loadingText="Yükleniyor..."
          w="100%"
          leftIcon={<Icon as={FaUpload} />}
        >
          Yükle ve İşle
        </Button>
      </VStack>
    </Box>
  );
};

export default PDFUploader;
