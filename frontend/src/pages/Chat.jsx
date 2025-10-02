import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';

import { requestChat } from '../lib/api.js';

function ChatPage() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        message: input.trim(),
        history: nextMessages
      };
      const response = await requestChat(payload);
      const reply =
        response.reply ||
        response.message ||
        response.text ||
        JSON.stringify(response, null, 2);

      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (error) {
      toast({
        title: 'Sohbet hatası',
        description: error.message,
        status: 'error',
        duration: 4000,
        position: 'top',
        isClosable: true
      });
      setMessages(nextMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={6} height="100%">
      <Box>
        <Heading size="lg">AI Chat</Heading>
        <Text fontSize="sm" color="gray.300" mt={1}>
          Kozmik rehbere sorularını sor, astrolojik sohbet başlat.
        </Text>
      </Box>

      <Box
        flex="1"
        p={6}
        bg="whiteAlpha.100"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        display="flex"
        flexDirection="column"
        minH="400px"
      >
        <VStack align="stretch" spacing={3} flex="1" overflowY="auto" pr={2}>
          {messages.length === 0 && (
            <Text color="gray.400">Henüz mesaj yok. İlk sorunu sor!</Text>
          )}
          {messages.map((message, index) => (
            <Box
              key={`${message.role}-${index}`}
              alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
              bg={message.role === 'user' ? 'teal.500' : 'whiteAlpha.300'}
              color="white"
              px={4}
              py={2}
              borderRadius="lg"
              maxW="80%"
              fontSize="sm"
              whiteSpace="pre-wrap"
            >
              {message.content}
            </Box>
          ))}
        </VStack>

        <Box as="form" onSubmit={handleSubmit} mt={4}>
          <FormControl>
            <FormLabel>Sorunuzu yazın</FormLabel>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Örn. Bu hafta aşk hayatım nasıl?"
            />
          </FormControl>
          <Button type="submit" mt={3} colorScheme="teal" isLoading={loading}>
            Gönder
          </Button>
        </Box>
      </Box>
    </Stack>
  );
}

export default ChatPage;
