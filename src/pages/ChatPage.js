import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Input,
  Button,
  Text,
  useColorModeValue,
  Heading,
  HStack,
  Avatar,
  Flex,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { FaPaperPlane, FaRobot } from 'react-icons/fa';
import { API_URL, DEFAULT_AVATAR } from '../config';

const Message = ({ message, isUser }) => {
  const userBgColor = useColorModeValue('purple.500', 'purple.500');
  const botBgColor = useColorModeValue('gray.100', 'gray.700');
  const userTextColor = 'white';
  const botTextColor = useColorModeValue('gray.800', 'white');

  return (
    <Flex justify={isUser ? 'flex-end' : 'flex-start'} w="100%">
      {!isUser && (
        <Avatar
          size="sm"
          icon={<FaRobot />}
          bg="purple.500"
          color="white"
          mr={2}
        />
      )}
      <Box
        maxW="70%"
        bg={isUser ? userBgColor : botBgColor}
        color={isUser ? userTextColor : botTextColor}
        p={3}
        borderRadius="lg"
        my={1}
      >
        <Text>{message.content}</Text>
      </Box>
      {isUser && (
        <Avatar
          size="sm"
          name={localStorage.getItem('name')}
          src={DEFAULT_AVATAR}
          ml={2}
        />
      )}
    </Flex>
  );
};

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const chatBgColor = useColorModeValue('white', 'gray.800');
  const scrollbarThumbColor = useColorModeValue('gray.300', 'gray.600');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      content: input,
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userId: localStorage.getItem('userId'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      setMessages(prev => [...prev, {
        content: data.response,
        isUser: false,
      }]);
    } catch (error) {
      console.error('Chat error:', error);
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
      handleSend();
    }
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} h="calc(100vh - 100px)">
          <Heading>Astroloji Asistanı</Heading>
          
          {/* Messages Container */}
          <Box
            flex={1}
            w="100%"
            bg={chatBgColor}
            borderRadius="lg"
            p={4}
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: scrollbarThumbColor,
                borderRadius: '24px',
              },
            }}
          >
            <VStack spacing={4} align="stretch">
              {messages.map((message, index) => (
                <Message
                  key={index}
                  message={message}
                  isUser={message.isUser}
                />
              ))}
              <div ref={messagesEndRef} />
            </VStack>
          </Box>

          {/* Input Area */}
          <HStack w="100%">
            <Input
              placeholder="Astroloji hakkında bir soru sorun..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <IconButton
              colorScheme="purple"
              aria-label="Send message"
              icon={<FaPaperPlane />}
              onClick={handleSend}
              isLoading={isLoading}
            />
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default ChatPage;
