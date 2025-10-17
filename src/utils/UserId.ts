function generateRandomCode() {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `FFMT${randomPart}`;
}

export { generateRandomCode };
