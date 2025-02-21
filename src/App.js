import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ChakraProvider, Box } from "@chakra-ui/react";
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
import "./App.css";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('userId') && localStorage.getItem('natalChartData');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const [result, setResult] = useState(null);

  return (
    <ChakraProvider>
      <Router>
        <Box pb={20}> {/* Add padding bottom to account for TabBar */}
          <div className="App">
            <img src={Group1} alt="Background Decoration 1" className="group1" />
            <img src={Group2} alt="Background Decoration 2" className="group2" />
            <Header />
            <div className="content">
              <img src={Chart} alt="Astrology Chart" className="chart" />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route 
                  path="/input" 
                  element={<InputForm setResult={setResult} />} 
                />
                <Route 
                  path="/" 
                  element={
                    <PrivateRoute>
                      <HomePage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/character" 
                  element={
                    <PrivateRoute>
                      <CharacterPage result={result} />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/transit" 
                  element={
                    <PrivateRoute>
                      <TransitPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/synastry" 
                  element={
                    <PrivateRoute>
                      <SynastryPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/synastry/form" 
                  element={
                    <PrivateRoute>
                      <SynastryForm />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/synastry/result" 
                  element={
                    <PrivateRoute>
                      <SynastryResultPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/life-purpose" 
                  element={
                    <PrivateRoute>
                      <LifePurposePage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <PrivateRoute>
                      <AdminPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <PrivateRoute>
                      <SettingsPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile/edit" 
                  element={
                    <PrivateRoute>
                      <EditProfilePage />
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </div>
          </div>
          <TabBar />
        </Box>
      </Router>
    </ChakraProvider>
  );
};

export default App;
