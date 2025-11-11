export const sanitize = (value) =>
  (value || "")
    .replace(/```+json|```+|^json\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
