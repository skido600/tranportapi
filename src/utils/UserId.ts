function generateRandomCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";

  for (let i = 0; i < 7; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  if (!/\d/.test(code)) {
    const randomNum = Math.floor(Math.random() * 10);
    const randomPos = Math.floor(Math.random() * code.length);
    code =
      code.substring(0, randomPos) + randomNum + code.substring(randomPos + 1);
  }

  console.log(code);
  return code;
}

export { generateRandomCode };
