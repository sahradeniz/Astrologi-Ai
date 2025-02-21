import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ChakraProvider, Box, Flex, Tabs, TabList, Tab, Button, ColorModeToggle } from "@chakra-ui/react";
import Group1 from "./assets/Group1.png";
import Group2 from "./assets/group2.png";
import Chart from "./assets/chart.png";
import Header from "./components/Header";
import InputForm from "./components/InputForm";
import CharacterPage from "./pages/CharacterPage";
import TransitPage from "./pages/TransitPage";
import SynastryPage from "./pages/SynastryPage";
import LifePurposePage from "./pages/LifePurposePage";
import AdminPage from './pages/AdminPage';
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import TabBar from "./components/TabBar";
import SynastryForm from './components/SynastryForm';
import SynastryResultPage from './pages/SynastryResultPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import EditProfilePage from './pages/EditProfilePage';
import FriendsPage from './pages/FriendsPage';
import SynastryResultsPage from './pages/SynastryResultsPage';
import ChatPage from './pages/ChatPage';
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab === 'home' ? '/' : `/${tab}`);
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg={bgColor}>
        {isAuthenticated && (
          <Box bg={useColorModeValue('white', 'gray.800')} px={4} shadow="sm">
            <Flex h={16} alignItems="center" justifyContent="space-between">
              <Tabs 
                variant="soft-rounded" 
                colorScheme="purple"
                index={['home', 'profile', 'friends', 'chat'].indexOf(activeTab)}
                onChange={(index) => handleTabChange(['home', 'profile', 'friends', 'chat'][index])}
              >
                <TabList>
                  <Tab>Ana Sayfa</Tab>
                  <Tab>Profil</Tab>
                  <Tab>Arkadaşlar</Tab>
                  <Tab>Sohbet</Tab>
                </TabList>
              </Tabs>
              <Flex alignItems="center">
                <ColorModeToggle />
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.clear();
                    setIsAuthenticated(false);
                    navigate('/login');
                  }}
                  ml={4}
                >
                  Çıkış
                </Button>
              </Flex>
            </Flex>
          </Box>
        )}
        
        <Box p={4}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/input" 
              element={
                <ProtectedRoute>
                  <InputForm setResult={useState(null)} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/character" 
              element={
                <ProtectedRoute>
                  <CharacterPage result={useState(null)} />
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
              path="/synastry" 
              element={
                <ProtectedRoute>
                  <SynastryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/synastry/form" 
              element={
                <ProtectedRoute>
                  <SynastryForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/synastry/result" 
              element={
                <ProtectedRoute>
                  <SynastryResultPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/synastry-results" 
              element={
                <ProtectedRoute>
                  <SynastryResultsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/life-purpose" 
              element={
                <ProtectedRoute>
                  <LifePurposePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
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
              path="/friends" 
              element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/edit" 
              element={
                <ProtectedRoute>
                  <EditProfilePage />
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
          </Routes>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
