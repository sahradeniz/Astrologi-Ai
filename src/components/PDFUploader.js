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
  Progress
} from '@chakra-ui/react';

const PDFUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: 'Hata',
        description: 'Lütfen sadece PDF dosyası yükleyin.',
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
        description: 'Lütfen bir PDF dosyası seçin.',
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
      const response = await fetch('http://localhost:5003/upload_pdf', {
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
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
      <VStack spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          PDF Yükle
        </Text>
        <Text color="gray.600">
          Astrolojik yorumlar içeren PDF dosyalarını yükleyerek sistemin bilgi tabanını genişletebilirsiniz.
        </Text>
        <FormControl>
          <FormLabel>PDF Dosyası Seç</FormLabel>
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </FormControl>
        {isUploading && <Progress size="xs" isIndeterminate w="100%" />}
        <Button
          colorScheme="purple"
          onClick={handleUpload}
          isLoading={isUploading}
          loadingText="Yükleniyor..."
          w="100%"
        >
          Yükle ve İşle
        </Button>
      </VStack>
    </Box>
  );
};

export default PDFUploader;
