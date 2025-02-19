import React from 'react';
import { ChakraProvider, Box, useColorModeValue } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CharacterPage from './pages/CharacterPage';
import SynastryPage from './pages/SynastryPage';
import TransitPage from './pages/TransitPage';
import InputForm from './components/InputForm';

function App() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh" bg={bgColor}>
          <Navbar />
          <Box as="main" py={8}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/input" element={<InputForm />} />
              <Route path="/character" element={<CharacterPage />} />
              <Route path="/synastry" element={<SynastryPage />} />
              <Route path="/transit" element={<TransitPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;
