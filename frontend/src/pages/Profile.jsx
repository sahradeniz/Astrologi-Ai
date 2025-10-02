import {
  Avatar,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Switch,
  Text
} from '@chakra-ui/react';

function ProfilePage() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">Profil</Heading>
        <Text fontSize="sm" color="gray.300" mt={1}>
          Bilgilerini güncelle, bildirim tercihlerini yönet.
        </Text>
      </Box>

      <Box
        p={6}
        bg="whiteAlpha.100"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
      >
        <Stack spacing={5}>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} align="center">
            <Avatar name="Kullanıcı" size="lg" />
            <Box>
              <Text fontWeight="bold">Ayşe Yıldız</Text>
              <Text fontSize="sm" color="gray.300">
                Premium Üye
              </Text>
            </Box>
          </Stack>

          <FormControl>
            <FormLabel>E-posta</FormLabel>
            <Input defaultValue="ayse@example.com" readOnly />
          </FormControl>

          <FormControl>
            <FormLabel>Doğum Tarihi</FormLabel>
            <Input type="date" defaultValue="1994-05-12" />
          </FormControl>

          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <FormLabel mb="0">Haftalık astroloji bülteni</FormLabel>
            <Switch defaultChecked colorScheme="teal" />
          </FormControl>

          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <FormLabel mb="0">Bildirimleri aç</FormLabel>
            <Switch colorScheme="purple" />
          </FormControl>

          <Button alignSelf="flex-start" colorScheme="teal">
            Değişiklikleri Kaydet
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}

export default ProfilePage;
