import React from 'react';
import {
  ChakraProvider,
  Box,
  useColorMode,
  IconButton,
  Flex,
  Spacer,
  Button,
  Text,
  useColorModeValue,
  Container,
  VStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tabs,
  TabList,
  Tab,
} from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { FaUser, FaSignOutAlt, FaHome, FaComments, FaUserCircle } from 'react-icons/fa';
import theme from './theme';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CharacterPage from './pages/CharacterPage';
import TransitPage from './pages/TransitPage';
import SynastryFormPage from './pages/SynastryFormPage';
import SynastryResultsPage from './pages/SynastryResultsPage';
import ChatPage from './pages/ChatPage';
import "./App.css";

const ColorModeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
    />
  );
};

const TopBar = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const isLoggedIn = !!localStorage.getItem('token');
  const userName = localStorage.getItem('name');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Box 
      bg={bgColor} 
      px={4} 
      position="sticky" 
      top={0} 
      zIndex={1000}
      borderBottom="1px" 
      borderColor={borderColor}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center">
          <Link to="/">
            <Text fontSize="xl" fontWeight="bold">
              Astrologi AI
            </Text>
          </Link>

          <Spacer />

          {isLoggedIn && (
            <Menu>
              <MenuButton>
                <Avatar size="sm" name={userName} />
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FaUser />} as={Link} to="/profile">
                  Profil
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>
                  Çıkış Yap
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('purple.500', 'purple.300');
  const isLoggedIn = !!localStorage.getItem('token');

  if (!isLoggedIn) return null;

  const getTabIndex = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/chat':
        return 1;
      case '/profile':
        return 2;
      default:
        return 0;
    }
  };

  const handleTabChange = (index) => {
    switch (index) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/chat');
        break;
      case 2:
        navigate('/profile');
        break;
    }
  };

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      zIndex={1000}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
    >
      <Container maxW="container.xl">
        <Tabs
          isFitted
          variant="unstyled"
          colorScheme="purple"
          index={getTabIndex()}
          onChange={handleTabChange}
          pt={2}
          pb={2}
        >
          <TabList>
            <Tab
              _selected={{
                color: activeColor,
                transform: 'scale(1.1)',
                transition: 'all 0.2s'
              }}
            >
              <VStack spacing={1}>
                <FaHome size="20px" />
                <Text fontSize="xs">Ana Sayfa</Text>
              </VStack>
            </Tab>
            <Tab
              _selected={{
                color: activeColor,
                transform: 'scale(1.1)',
                transition: 'all 0.2s'
              }}
            >
              <VStack spacing={1}>
                <FaComments size="20px" />
                <Text fontSize="xs">Sohbet</Text>
              </VStack>
            </Tab>
            <Tab
              _selected={{
                color: activeColor,
                transform: 'scale(1.1)',
                transition: 'all 0.2s'
              }}
            >
              <VStack spacing={1}>
                <FaUserCircle size="20px" />
                <Text fontSize="xs">Profil</Text>
              </VStack>
            </Tab>
          </TabList>
        </Tabs>
      </Container>
    </Box>
  );
};

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('token');
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box minH="100vh" position="relative" pb="80px"> 
          <TopBar />
          <Container maxW="container.xl" py={4}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/character"
                element={
                  <ProtectedRoute>
                    <CharacterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transit"
                element={
                  <ProtectedRoute>
                    <TransitPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/synastry/form"
                element={
                  <ProtectedRoute>
                    <SynastryFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/synastry/results"
                element={
                  <ProtectedRoute>
                    <SynastryResultsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/friends/add"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
          <BottomNavigation />
        </Box>
      </Router>
    </ChakraProvider>
  );
};

export default App;
