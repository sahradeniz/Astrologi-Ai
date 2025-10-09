import PropTypes from "prop-types";
import { Flex, Icon, Text } from "@chakra-ui/react";

const NavigationBar = ({ items, currentPath, onNavigate }) => (
  <Flex
    position="fixed"
    bottom={{ base: 4, md: 6 }}
    left="50%"
    transform="translateX(-50%)"
    bg="rgba(255,255,255,0.8)"
    backdropFilter="blur(18px)"
    borderRadius="full"
    boxShadow="xl"
    px={4}
    py={2}
    align="center"
    gap={2}
    zIndex={1000}
    border="1px solid rgba(255,255,255,0.5)"
  >
    {items.map((item) => {
      const isActive =
        currentPath === item.path ||
        (item.path !== "/home" && currentPath.startsWith(item.path));
      return (
        <Flex
          key={item.path}
          as="button"
          onClick={() => onNavigate(item.path)}
          align="center"
          direction="column"
          px={{ base: 3, md: 4 }}
          py={2}
          borderRadius="full"
          bg={isActive ? "blackAlpha.100" : "transparent"}
          transition="all 0.2s ease"
        >
          <Icon
            as={item.icon}
            boxSize={5}
            color={isActive ? "purple.600" : "gray.600"}
          />
          <Text
            fontSize="xs"
            mt={1}
            color={isActive ? "purple.600" : "gray.600"}
            fontWeight={isActive ? "semibold" : "medium"}
          >
            {item.label}
          </Text>
        </Flex>
      );
    })}
  </Flex>
);

NavigationBar.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ).isRequired,
  currentPath: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default NavigationBar;
