import React from 'react';
import { Box, Flex, Icon, Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaBook, FaUser } from 'react-icons/fa';

const TabBar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const tabs = [
    { icon: FaHome, label: 'Anasayfa', path: '/' },
    { icon: FaUsers, label: 'Arkadaşlar', path: '/friends' },
    { icon: FaBook, label: 'Öğren', path: '/learn' },
    { icon: FaUser, label: 'Profil', path: '/profile' },
  ];

  return (
    <Box bg="white" shadow="sm" position="fixed" bottom="0" left="0" right="0" zIndex="1000">
      <Flex justify="space-around" p={2}>
        {tabs.map((tab, index) => (
          <Link
            key={index}
            as={RouterLink}
            to={tab.path}
            flex={1}
            textAlign="center"
            py={2}
            color={isActive(tab.path) ? "purple.500" : "gray.500"}
            _hover={{ color: "purple.500" }}
          >
            <Icon as={tab.icon} boxSize={6} />
          </Link>
        ))}
      </Flex>
    </Box>
  );
};

export default TabBar;
