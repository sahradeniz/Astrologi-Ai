import {
  Box,
  Container,
  Flex,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react";
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
  User,
} from "lucide-react";

import Bond from "./pages/Bond.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import StoryStudio from "./pages/StoryStudio.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import ThisYearYou from "./pages/ThisYearYou.jsx";
import Settings from "./pages/Settings.jsx";

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
  { label: "Profile", path: "/profile", icon: User },
];

const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showBottomNav = location.pathname !== "/";

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
                    <Onboarding />
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
        <Flex
          position="fixed"
          bottom={{ base: 4, md: 6 }}
          left="50%"
          transform="translateX(-50%)"
          bg="whiteAlpha.800"
          backdropFilter="blur(16px)"
          borderRadius="full"
          boxShadow="xl"
          px={4}
          py={2}
          align="center"
          gap={2}
          zIndex={1000}
          border="1px solid rgba(255,255,255,0.4)"
        >
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/home" && location.pathname.startsWith(item.path));

            return (
              <Flex
                key={item.path}
                as="button"
                onClick={() => navigate(item.path)}
                align="center"
                direction="column"
                px={{ base: 3, md: 4 }}
                py={2}
                borderRadius="full"
                bg={isActive ? "blackAlpha.100" : "transparent"}
                transition="all 0.2s ease"
              >
                <Icon
                  as={item.icon}
                  boxSize={5}
                  color={isActive ? "purple.600" : "gray.600"}
                />
                <Text
                  fontSize="xs"
                  mt={1}
                  color={isActive ? "purple.600" : "gray.600"}
                  fontWeight={isActive ? "semibold" : "medium"}
                >
                  {item.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>
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
