import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  IconButton,
  useColorModeValue,
  Button,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FaHeart, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const FriendCard = ({ friend, onDelete, onAnalyze }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      width="full"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
    >
      <HStack spacing={4} justify="space-between">
        <HStack spacing={4}>
          <Avatar name={friend.name} size="md" />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold">{friend.name}</Text>
            <Text fontSize="sm" color="gray.500">
              {friend.birthDate}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {friend.birthPlace}
            </Text>
          </VStack>
        </HStack>
        <HStack>
          <IconButton
            icon={<FaHeart />}
            colorScheme="purple"
            variant="ghost"
            onClick={() => onAnalyze(friend)}
            aria-label="Analyze compatibility"
          />
          <IconButton
            icon={<FaTrash />}
            colorScheme="red"
            variant="ghost"
            onClick={() => onDelete(friend)}
            aria-label="Delete friend"
          />
        </HStack>
      </HStack>
    </Box>
  );
};

const FriendsList = () => {
  const [friends, setFriends] = React.useState(() => {
    return JSON.parse(localStorage.getItem('friends') || '[]');
  });

  const navigate = useNavigate();
  const toast = useToast();

  const handleDelete = (friendToDelete) => {
    const newFriends = friends.filter(
      friend => friend.birthDate !== friendToDelete.birthDate ||
               friend.birthTime !== friendToDelete.birthTime
    );
    setFriends(newFriends);
    localStorage.setItem('friends', JSON.stringify(newFriends));
    
    toast({
      title: "Kişi silindi",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleAnalyze = (friend) => {
    // Store selected friend data for synastry
    localStorage.setItem('selectedFriend', JSON.stringify(friend));
    navigate('/synastry');
  };

  return (
    <VStack spacing={4} width="full">
      <Button
        leftIcon={<FaHeart />}
        colorScheme="purple"
        onClick={() => navigate('/synastry')}
        width="full"
      >
        Yeni Uyum Analizi
      </Button>

      <Divider />

      {friends.length > 0 ? (
        friends.map((friend, index) => (
          <FriendCard
            key={index}
            friend={friend}
            onDelete={handleDelete}
            onAnalyze={handleAnalyze}
          />
        ))
      ) : (
        <Text color="gray.500" textAlign="center" py={8}>
          Henüz kaydedilmiş kişi yok.
          <br />
          Uyum analizi yaparak kişileri kaydedebilirsiniz.
        </Text>
      )}
    </VStack>
  );
};

export default FriendsList;
