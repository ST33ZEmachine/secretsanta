import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign({ id: userId, email }, secret, { expiresIn: '7d' } as any);
};

export const generateId = (): string => {
  return uuidv4();
};

export const generateInviteToken = (): string => {
  return uuidv4();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};


