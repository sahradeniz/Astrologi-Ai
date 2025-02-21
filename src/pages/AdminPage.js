import React from 'react';
import { Container, Heading, VStack } from '@chakra-ui/react';
import PDFUploader from '../components/PDFUploader';

const AdminPage = () => {
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>Yönetici Paneli</Heading>
        <PDFUploader />
      </VStack>
    </Container>
  );
};

export default AdminPage;
