import React from 'react';
import {
  Box,
  HStack,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaStar, FaBook, FaCog } from 'react-icons/fa';

const TabItem = ({ icon, label, to, isActive }) => {
  const activeColor = useColorModeValue('purple.500', 'purple.300');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <Link to={to}>
      <IconButton
        icon={icon}
        variant={isActive ? 'solid' : 'ghost'}
        colorScheme={isActive ? 'purple' : 'gray'}
        aria-label={label}
      />
    </Link>
  );
};

const TabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isActive = (path) => location.pathname === path;

  const tabs = [
    { icon: FaHome, label: 'Ana Sayfa', path: '/' },
    { icon: FaStar, label: 'Haritam', path: '/character' },
    { icon: FaBook, label: 'Öğren', path: '/learn' },
    { icon: FaUser, label: 'Profil', path: '/profile' },
    { icon: FaCog, label: 'Ayarlar', path: '/settings' },
  ];

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      py={2}
      px={4}
      zIndex={1000}
    >
      <HStack justify="space-around" maxW="container.xl" mx="auto">
        {tabs.map((tab) => (
          <TabItem
            key={tab.path}
            icon={<tab.icon />}
            label={tab.label}
            to={tab.path}
            isActive={isActive(tab.path)}
          />
        ))}
      </HStack>
    </Box>
  );
};

export default TabBar;
