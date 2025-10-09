import {
  Card,
  CardBody,
  Heading,
  Stack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";

const Settings = () => (
  <VStack spacing={8} align="stretch">
    <Heading
      size="xl"
      bgGradient="linear(to-r, #FAD961, #F76B1C)"
      bgClip="text"
    >
      Settings
    </Heading>
    <Card borderRadius="2xl" bg="whiteAlpha.900" boxShadow="xl">
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Stack direction="row" align="center" justify="space-between">
            <Text color="gray.700">Push Notifications</Text>
            <Switch colorScheme="purple" isDisabled defaultChecked />
          </Stack>
          <Stack direction="row" align="center" justify="space-between">
            <Text color="gray.700">Celestial Soundscapes</Text>
            <Switch colorScheme="purple" isDisabled />
          </Stack>
          <Stack direction="row" align="center" justify="space-between">
            <Text color="gray.700">Beta Features</Text>
            <Switch colorScheme="purple" isDisabled />
          </Stack>
          <Text color="gray.500" fontSize="sm">
            More configuration options are on the horizon. Thank you for
            journeying with Jovia. 🌙
          </Text>
        </VStack>
      </CardBody>
    </Card>
  </VStack>
);

export default Settings;
