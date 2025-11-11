import { extendTheme } from "@chakra-ui/react";

const colors = {
  brand: {
    lilac: "#DCC9F9",
    blue: "#5C6BF2",
    peach: "#FDD1A3",
    rose: "#F7D9D9",
    midnight: "#1E1B29",
    ivory: "#FAF9FB",
    coral: "#FF6B6B",
    blush: "#EAB8FF",
  },
};

const fonts = {
  heading: "'Playfair Display', 'Times New Roman', serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const styles = {
  global: {
    body: {
      bg: "brand.ivory",
      color: "brand.midnight",
      fontFamily: fonts.body,
      backgroundImage:
        "radial-gradient(circle at 20% 20%, rgba(220, 201, 249, 0.35), transparent 55%), radial-gradient(circle at 80% 10%, rgba(92, 107, 242, 0.28), transparent 60%), radial-gradient(circle at 50% 90%, rgba(253, 209, 163, 0.25), transparent 55%)",
      backgroundAttachment: "fixed",
    },
    "#root": {
      minHeight: "100vh",
    },
  },
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: "600",
      borderRadius: "xl",
      letterSpacing: "0.02em",
    },
    variants: {
      gradient: {
        bgGradient: "linear(135deg, #5C6BF2 0%, #DCC9F9 55%, #FDD1A3 100%)",
        color: "brand.ivory",
        boxShadow: "0 18px 40px rgba(92, 107, 242, 0.28)",
        _hover: { filter: "brightness(1.05)" },
        _active: { filter: "brightness(0.95)" },
      },
      ghost: {
        borderRadius: "full",
        px: 5,
        py: 2,
        fontWeight: "600",
        color: "brand.midnight",
        _hover: {
          bg: "rgba(92, 107, 242, 0.08)",
        },
      },
      outline: {
        borderRadius: "xl",
        borderWidth: "2px",
        borderColor: "brand.midnight",
        color: "brand.midnight",
        _hover: {
          bg: "rgba(92, 107, 242, 0.08)",
        },
      },
    },
  },
  Heading: {
    baseStyle: {
      color: "brand.midnight",
      letterSpacing: "-0.01em",
    },
  },
  Text: {
    baseStyle: {
      color: "brand.midnight",
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: "full",
      px: 3,
      py: 1,
      bg: "rgba(92, 107, 242, 0.08)",
      color: "brand.blue",
      fontWeight: "600",
      textTransform: "none",
      letterSpacing: "0.02em",
    },
  },
  Container: {
    baseStyle: {
      maxW: "960px",
    },
  },
};

const shadows = {
  aura: "0 20px 45px rgba(92, 107, 242, 0.20)",
  soft: "0 18px 35px rgba(30, 27, 41, 0.08)",
};

const theme = extendTheme({
  colors,
  fonts,
  styles,
  components,
  shadows,
});

export default theme;
