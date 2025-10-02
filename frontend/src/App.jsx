import { Box, Container, Flex } from '@chakra-ui/react';
import { Navigate, Route, Routes } from 'react-router-dom';

import TabNavigation from './components/TabNavigation.jsx';
import BondPage from './pages/Bond.jsx';
import ChatPage from './pages/Chat.jsx';
import HomePage from './pages/Home.jsx';
import ProfilePage from './pages/Profile.jsx';
import StoryStudioPage from './pages/StoryStudio.jsx';

function App() {
  return (
    <Flex
      minH="100vh"
      direction="column"
      bgGradient="linear(to-b, rgba(11,17,32,1), rgba(30,27,75,0.9))"
      color="gray.100"
    >
      <Box flex="1" pb={{ base: '90px', md: '96px' }}>
        <Container maxW="container.md" py={{ base: 8, md: 12 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bond" element={<BondPage />} />
            <Route path="/story-studio" element={<StoryStudioPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
      <TabNavigation />
    </Flex>
  );
}

export default App;
