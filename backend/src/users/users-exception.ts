import { HttpException, HttpStatus } from '@nestjs/common';

export enum UserValidationError {
  UsernameTaken = 'Username is already taken.',
  UserNotFound = 'User not found.',
  UserEmpty = 'No registered users exist.',

  EmailNotFound = 'Email not found.',
  EmailSame = 'The new email is the same as the current email.',
  EmailEmpty = 'The new email cannot be empty.',
  EmailTaken = 'Email is already in use.',
  EmailAlreadyExists = 'Email is already in use.',

  PasswordIncorrect = 'Password is incorrect.',
  PasswordShort = 'Password must be at least 8 characters long.',
  PasswordNotFound = 'Current password is incorrect.',
  PasswordSame = 'New password cannot be the same as the current password.',
  PasswordEmpty = 'New password cannot be empty.',
  PasswordNotEqual = 'New password does not match the verification.',

  CredentialInvalid = 'Invalid credentials. Please try again.',
  FieldsRequired = 'Field is required.',

  TokenInvalid = 'Invalid token.',
}

export class UserValidationException extends HttpException {
  constructor(validationError: UserValidationError, statusCode: HttpStatus) {
    super(validationError, statusCode);
  }
}
