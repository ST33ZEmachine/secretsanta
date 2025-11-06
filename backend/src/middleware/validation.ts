import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  validateRequest
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest
];

export const validateGroupCreation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Group name must be at least 2 characters long'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 3, max: 50 })
    .withMessage('Max participants must be between 3 and 50'),
  validateRequest
];

export const validateEmailInvite = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  validateRequest
];


