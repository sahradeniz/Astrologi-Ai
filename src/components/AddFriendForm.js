import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  InputGroup,
  InputLeftElement,
  Icon,
  FormErrorMessage,
} from '@chakra-ui/react';
import { FaUser, FaCalendar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const AddFriendForm = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "İsim gerekli";
    if (!formData.birthDate) newErrors.birthDate = "Doğum tarihi gerekli";
    if (!formData.birthTime) newErrors.birthTime = "Doğum saati gerekli";
    if (!formData.birthPlace) newErrors.birthPlace = "Doğum yeri gerekli";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Get existing friends from localStorage
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    
    // Check if friend already exists
    const exists = friends.some(friend => 
      friend.birthDate === formData.birthDate && 
      friend.birthTime === formData.birthTime
    );

    if (exists) {
      toast({
        title: "Hata",
        description: "Bu kişi zaten arkadaş listenizde bulunuyor.",
        status: "error",
        duration: 3000,
      });
      setIsLoading(false);
      return;
    }

    // Add new friend
    friends.push(formData);
    localStorage.setItem('friends', JSON.stringify(friends));

    setIsLoading(false);
    toast({
      title: "Başarılı",
      description: "Kişi arkadaş listenize eklendi.",
      status: "success",
      duration: 3000,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Arkadaş Ekle</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={errors.name}>
              <FormLabel>İsim</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FaUser} color="gray.500" />
                </InputLeftElement>
                <Input
                  pl={10}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </InputGroup>
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.birthDate}>
              <FormLabel>Doğum Tarihi</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FaCalendar} color="gray.500" />
                </InputLeftElement>
                <Input
                  pl={10}
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </InputGroup>
              <FormErrorMessage>{errors.birthDate}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.birthTime}>
              <FormLabel>Doğum Saati</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FaClock} color="gray.500" />
                </InputLeftElement>
                <Input
                  pl={10}
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                />
              </InputGroup>
              <FormErrorMessage>{errors.birthTime}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.birthPlace}>
              <FormLabel>Doğum Yeri</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FaMapMarkerAlt} color="gray.500" />
                </InputLeftElement>
                <Input
                  pl={10}
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                />
              </InputGroup>
              <FormErrorMessage>{errors.birthPlace}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            İptal
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Ekle
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddFriendForm;
