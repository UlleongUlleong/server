import * as crypto from 'crypto';

export const generateRandomCode = (length: number, base: number): string => {
  if (base < 2 || base > 36) {
    throw new Error('진법은 2에서 36까지만 사용할 수 있습니다.');
  }
  const max = Math.pow(base, length);
  return Math.floor(Math.random() * max)
    .toString(base)
    .padStart(length, '0');
};

export const generateRandomPassword = (length: number = 8): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    password += characters[randomIndex];
  }
  return password;
};
