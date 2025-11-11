import PropTypes from "prop-types";
import { Flex, Icon, Text } from "@chakra-ui/react";

const NavigationBar = ({ items, currentPath, onNavigate }) => (
  <Flex
    position="fixed"
    bottom={{ base: 4, md: 6 }}
    left="50%"
    transform="translateX(-50%)"
    bg="rgba(250, 249, 251, 0.92)"
    backdropFilter="blur(14px)"
    borderRadius="36px"
    boxShadow="0 20px 35px rgba(92, 107, 242, 0.18)"
    px={5}
    py={3}
    align="center"
    gap={3}
    zIndex={1000}
    border="1px solid rgba(92, 107, 242, 0.18)"
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
          borderRadius="28px"
          bg={isActive ? "rgba(92, 107, 242, 0.12)" : "transparent"}
          transition="all 0.2s ease"
        >
          <Icon
            as={item.icon}
            boxSize={5}
            color={isActive ? "brand.blue" : "rgba(30,27,41,0.55)"}
          />
          <Text
            fontSize="xs"
            mt={1}
            color={isActive ? "brand.blue" : "rgba(30,27,41,0.65)"}
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
