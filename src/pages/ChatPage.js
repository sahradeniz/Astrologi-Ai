import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Input,
  Button,
  Text,
  useToast,
  useColorModeValue,
  Textarea,
  Flex,
  Avatar,
  Spinner,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        toast({
          title: 'Oturum Hatası',
          description: 'Lütfen tekrar giriş yapın',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
        return;
      }

      // Add user message to chat immediately
      const userMessage = {
        type: 'user',
        content: inputMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Clear input field
      setInputMessage('');

      // Send message to API
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mesaj gönderilemedi');
      }

      const data = await response.json();
      console.log('AI Response:', data); // Debug log

      if (!data.response) {
        throw new Error('AI yanıtı alınamadı');
      }

      // Add AI response to chat
      const aiMessage = {
        type: 'ai',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Box
        bg={bgColor}
        borderRadius="lg"
        boxShadow="md"
        p={4}
        height="80vh"
        display="flex"
        flexDirection="column"
      >
        <Box flex="1" overflowY="auto" mb={4} p={2}>
          <VStack spacing={4} align="stretch">
            {messages.map((message, index) => (
              <Flex
                key={index}
                justify={message.type === 'user' ? 'flex-end' : 'flex-start'}
              >
                <Box
                  maxW="70%"
                  bg={message.type === 'user' ? 'purple.500' : bgColor}
                  color={message.type === 'user' ? 'white' : 'inherit'}
                  p={3}
                  borderRadius="lg"
                  borderWidth={message.type === 'ai' ? '1px' : '0'}
                  borderColor={borderColor}
                >
                  <Text whiteSpace="pre-wrap">{message.content}</Text>
                </Box>
              </Flex>
            ))}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        <Box as="form" onSubmit={handleSendMessage}>
          <Flex>
            <Textarea
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              resize="none"
              rows={2}
              mr={2}
              disabled={isLoading}
            />
            <Button
              colorScheme="purple"
              type="submit"
              isLoading={isLoading}
              loadingText="Gönderiliyor..."
              leftIcon={<FaPaperPlane />}
              disabled={!inputMessage.trim() || isLoading}
            >
              Gönder
            </Button>
          </Flex>
        </Box>
      </Box>
    </Container>
  );
};

export default ChatPage;
