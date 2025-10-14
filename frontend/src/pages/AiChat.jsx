import React, { useState } from "react";
import { Box, Input, Button, VStack, Text } from "@chakra-ui/react";

import { sendChatMessage } from "../lib/api";

const AiChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const reply = await sendChatMessage(input);
    const botMsg = { sender: "jovia", text: reply };
    setMessages((prev) => [...prev, botMsg]);
    setInput("");
  };

  return (
    <Box p={6} maxW="600px" mx="auto">
      <VStack align="stretch" spacing={4}>
        {messages.map((msg, i) => (
          <Box
            key={i}
            bg={msg.sender === "jovia" ? "purple.50" : "gray.100"}
            p={3}
            borderRadius="xl"
            alignSelf={msg.sender === "jovia" ? "flex-start" : "flex-end"}
          >
            <Text>{msg.text}</Text>
          </Box>
        ))}
      </VStack>

      <Box mt={6} display="flex">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Jovia'ya bir şey sor..."
        />
        <Button onClick={handleSend} ml={2} colorScheme="purple">
          Gönder
        </Button>
      </Box>
    </Box>
  );
};

export default AiChat;
