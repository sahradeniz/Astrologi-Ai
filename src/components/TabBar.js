import React from 'react';
import {
  Box,
  HStack,
  Icon,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaStar, FaBook } from 'react-icons/fa';

const TabItem = ({ icon, label, to, isActive }) => {
  const activeColor = useColorModeValue('purple.500', 'purple.300');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <Link to={to}>
      <VStack
        spacing={1}
        color={isActive ? activeColor : inactiveColor}
        transition="all 0.2s"
        cursor="pointer"
        px={4}
      >
        <Icon
          as={icon}
          boxSize={6}
          transform={isActive ? 'scale(1.1)' : 'scale(1)'}
          transition="all 0.2s"
        />
        <Text fontSize="xs" fontWeight={isActive ? 'bold' : 'normal'}>
          {label}
        </Text>
      </VStack>
    </Link>
  );
};

const TabBar = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const tabs = [
    { icon: FaHome, label: 'Ana Sayfa', path: '/' },
    { icon: FaStar, label: 'Haritam', path: '/character' },
    { icon: FaBook, label: 'Öğren', path: '/learn' },
    { icon: FaUser, label: 'Profil', path: '/profile' },
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
            icon={tab.icon}
            label={tab.label}
            to={tab.path}
            isActive={location.pathname === tab.path}
          />
        ))}
      </HStack>
    </Box>
  );
};

export default TabBar;
