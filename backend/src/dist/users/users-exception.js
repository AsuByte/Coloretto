"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidationException = exports.UserValidationError = void 0;
const common_1 = require("@nestjs/common");
var UserValidationError;
(function (UserValidationError) {
    UserValidationError["UsernameTaken"] = "Username is already taken.";
    UserValidationError["UserNotFound"] = "User not found.";
    UserValidationError["UserEmpty"] = "No registered users exist.";
    UserValidationError["EmailNotFound"] = "Email not found.";
    UserValidationError["EmailSame"] = "The new email is the same as the current email.";
    UserValidationError["EmailEmpty"] = "The new email cannot be empty.";
    UserValidationError["EmailTaken"] = "Email is already in use.";
    UserValidationError["EmailAlreadyExists"] = "Email is already in use.";
    UserValidationError["PasswordIncorrect"] = "Password is incorrect.";
    UserValidationError["PasswordShort"] = "Password must be at least 8 characters long.";
    UserValidationError["PasswordNotFound"] = "Current password is incorrect.";
    UserValidationError["PasswordSame"] = "New password cannot be the same as the current password.";
    UserValidationError["PasswordEmpty"] = "New password cannot be empty.";
    UserValidationError["PasswordNotEqual"] = "New password does not match the verification.";
    UserValidationError["CredentialInvalid"] = "Invalid credentials. Please try again.";
    UserValidationError["FieldsRequired"] = "Field is required.";
    UserValidationError["TokenInvalid"] = "Invalid token.";
})(UserValidationError || (exports.UserValidationError = UserValidationError = {}));
class UserValidationException extends common_1.HttpException {
    constructor(validationError, statusCode) {
        super(validationError, statusCode);
    }
}
exports.UserValidationException = UserValidationException;
//# sourceMappingURL=users-exception.js.map