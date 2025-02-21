import React, { useState, useEffect } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';
import { FaHeart, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const FriendCard = ({ friend, friends, currentUser, onDelete, onAnalyze }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleAnalyze = () => {
    setIsModalOpen(true);
  };

  const handlePartnerSelect = () => {
    if (!selectedPartner) return;
    
    if (selectedPartner === 'currentUser') {
      onAnalyze(friend, currentUser);
    } else {
      const partner = friends.find(f => f.name === selectedPartner);
      if (partner) {
        onAnalyze(friend, partner);
      }
    }
    setIsModalOpen(false);
  };

  return (
    <>
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
              onClick={handleAnalyze}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Partner Seçin</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <RadioGroup onChange={setSelectedPartner} value={selectedPartner}>
              <Stack direction="column" spacing={4}>
                {/* Profil sahibi seçeneği */}
                <Radio value="currentUser">
                  <HStack spacing={3}>
                    <Avatar name={currentUser.name} size="sm" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{currentUser.name} (Profil Sahibi)</Text>
                      <Text fontSize="xs" color="gray.500">
                        {currentUser.birthDate}
                      </Text>
                    </VStack>
                  </HStack>
                </Radio>

                {/* Diğer arkadaşlar */}
                {friends
                  .filter(f => f.name !== friend.name)
                  .map((f, index) => (
                    <Radio key={index} value={f.name}>
                      <HStack spacing={3}>
                        <Avatar name={f.name} size="sm" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{f.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {f.birthDate}
                          </Text>
                        </VStack>
                      </HStack>
                    </Radio>
                  ))}
              </Stack>
            </RadioGroup>
            <Button
              colorScheme="purple"
              mt={6}
              width="full"
              onClick={handlePartnerSelect}
              leftIcon={<FaHeart />}
              isDisabled={!selectedPartner}
            >
              Uyum Analizi Yap
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const FriendsList = () => {
  const [friends, setFriends] = useState(() => {
    return JSON.parse(localStorage.getItem('friends') || '[]');
  });
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Get current user data from natalChartData
    const natalData = localStorage.getItem('natalChartData');
    if (natalData) {
      setCurrentUser(JSON.parse(natalData));
    }
  }, []);

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

  const handleAnalyze = (person1, person2) => {
    // Store both people's data for synastry
    localStorage.setItem('selectedPerson1', JSON.stringify(person1));
    localStorage.setItem('selectedPerson2', JSON.stringify(person2));
    navigate('/synastry');
  };

  if (!currentUser) {
    return (
      <Box textAlign="center" p={6}>
        <Text>Lütfen önce giriş yapın.</Text>
      </Box>
    );
  }

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
            friends={friends}
            currentUser={currentUser}
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
