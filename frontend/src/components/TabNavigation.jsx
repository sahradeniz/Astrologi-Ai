import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  ChatIcon,
  EditIcon,
  SettingsIcon,
  SunIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Home', path: '/', icon: SunIcon },
  { label: 'Bond', path: '/bond', icon: TimeIcon },
  { label: 'Story', path: '/story-studio', icon: EditIcon },
  { label: 'Chat', path: '/chat', icon: ChatIcon },
  { label: 'Profil', path: '/profile', icon: SettingsIcon }
];

function TabNavigation() {
  const location = useLocation();

  const normalizePath = (path) => {
    if (!path) {
      return '/';
    }
    return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  };

  const currentPath = normalizePath(location.pathname);

  return (
    <Box
      position="sticky"
      bottom="0"
      left="0"
      right="0"
      bg="rgba(15, 23, 42, 0.95)"
      borderTop="1px solid"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(10px)"
      zIndex="10"
      px={4}
      py={3}
    >
      <Flex maxW="container.md" mx="auto" justify="space-between">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(tab.path);

          return (
            <Flex
              key={tab.path}
              as={Link}
              to={tab.path}
              direction="column"
              align="center"
              gap={1}
              px={3}
              py={2}
              borderRadius="lg"
              color={isActive ? 'teal.200' : 'gray.300'}
              bg={isActive ? 'whiteAlpha.200' : 'transparent'}
              transition="all 0.2s"
              _hover={{ color: 'teal.100' }}
            >
              <Icon as={tab.icon} boxSize="18px" />
              <Text fontSize="xs" fontWeight="medium">
                {tab.label}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

export default TabNavigation;
