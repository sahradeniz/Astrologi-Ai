import { Box, Container, Flex } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BookOpen,
  HeartHandshake,
  Home as HomeIcon,
  MessageCircle,
  User,
} from "lucide-react";

import Bond from "./pages/Bond.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import StoryStudio from "./pages/StoryStudio.jsx";
import AiChat from "./pages/AiChat.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import ThisYearYou from "./pages/ThisYearYou.jsx";
import Settings from "./pages/Settings.jsx";
import SplashScreen from "./pages/SplashScreen.jsx";
import InterestSelection from "./pages/InterestSelection.jsx";
import StoryView from "./pages/StoryView.jsx";
import NavigationBar from "./components/NavigationBar.jsx";

const MotionBox = motion(Box);

const PageWrapper = ({ children }) => (
  <MotionBox
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    w="full"
  >
    {children}
  </MotionBox>
);

const navItems = [
  { label: "Home", path: "/home", icon: HomeIcon },
  { label: "Story", path: "/story-studio", icon: BookOpen },
  { label: "Bond", path: "/bond", icon: HeartHandshake },
  { label: "Chat", path: "/chat", icon: MessageCircle },
  { label: "Profile", path: "/profile", icon: User },
];

const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showBottomNav = !["/", "/onboarding"].includes(location.pathname);

  return (
    <Flex
      minH="100vh"
      direction="column"
      bgGradient="linear(to-b, #C2AFF0, #8E7FFF)"
      color="gray.800"
    >
      <Box flex="1" pb={showBottomNav ? { base: "90px", md: "110px" } : 0}>
        <Container maxW="container.md" py={{ base: 10, md: 16 }}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PageWrapper>
                    <SplashScreen />
                  </PageWrapper>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <PageWrapper>
                    <Onboarding />
                  </PageWrapper>
                }
              />
              <Route
                path="/interests"
                element={
                  <PageWrapper>
                    <InterestSelection />
                  </PageWrapper>
                }
              />
              <Route
                path="/home"
                element={
                  <PageWrapper>
                    <Home />
                  </PageWrapper>
                }
              />
              <Route
                path="/profile"
                element={
                  <PageWrapper>
                    <Profile />
                  </PageWrapper>
                }
              />
              <Route
                path="/bond"
                element={
                  <PageWrapper>
                    <Bond />
                  </PageWrapper>
                }
              />
              <Route
                path="/story-studio"
                element={
                  <PageWrapper>
                    <StoryStudio />
                  </PageWrapper>
                }
              />
              <Route
                path="/story/:id"
                element={
                  <PageWrapper>
                    <StoryView />
                  </PageWrapper>
                }
              />
              <Route
                path="/chat"
                element={
                  <PageWrapper>
                    <AiChat />
                  </PageWrapper>
                }
              />
              <Route
                path="/this-year-you"
                element={
                  <PageWrapper>
                    <ThisYearYou />
                  </PageWrapper>
                }
              />
              <Route
                path="/settings"
                element={
                  <PageWrapper>
                    <Settings />
                  </PageWrapper>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Container>
      </Box>

      {showBottomNav && (
        <NavigationBar
          items={navItems}
          currentPath={location.pathname}
          onNavigate={navigate}
        />
      )}
    </Flex>
  );
};

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
