import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import "./App.css";

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
                <Route path="/" element={<HomePage />} />
                <Route 
                  path="/input" 
                  element={<InputForm setResult={setResult} />} 
                />
                <Route 
                  path="/character" 
                  element={<CharacterPage initialData={result} />} 
                />
                <Route 
                  path="/transit" 
                  element={<TransitPage initialData={result} />} 
                />
                <Route path="/synastry" element={<SynastryPage />} />
                <Route path="/life-purpose" element={<LifePurposePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
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
