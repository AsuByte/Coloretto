"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const mongoose_1 = require("mongoose");
const mongoose = require("mongoose");
const common_1 = require("@nestjs/common");
const mongoose_2 = require("@nestjs/mongoose");
const user_schema_1 = require("./user.schema");
const users_exception_1 = require("./users-exception");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async getAllUsers() {
        return this.userModel.find().exec();
    }
    async getAllUsernames() {
        const users = await this.userModel.find().select('username').exec();
        return users.map((user) => user.username);
    }
    async areThereAnyUsers() {
        const count = await this.userModel.countDocuments().exec();
        return count > 0;
    }
    async createUser(fullname, username, email, password, profilePicture) {
        if (password.length < 8) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.PasswordShort, common_1.HttpStatus.LENGTH_REQUIRED);
        }
        const existingUserName = await this.findUserByUserName(username);
        if (existingUserName) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UsernameTaken, common_1.HttpStatus.CONFLICT);
        }
        const existingUserEmail = await this.findUserByEmail(email);
        if (existingUserEmail) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.EmailTaken, common_1.HttpStatus.CONFLICT);
        }
        const newUser = new this.userModel({
            _id: new mongoose.Types.ObjectId(),
            fullname,
            username,
            email,
            password,
            profilePicture,
        });
        return newUser.save();
    }
    async findById(_id) {
        return this.userModel.findOne({ _id }).exec();
    }
    async findUserByUserName(username) {
        return this.userModel.findOne({ username }).exec();
    }
    async findUserIdsByUsernames(usernames) {
        const userIds = await this.userModel
            .find({ username: { $in: usernames } })
            .select('_id')
            .exec();
        if (userIds.length !== usernames.length) {
            throw new common_1.NotFoundException('One or more users could not be found by ID.');
        }
        return userIds.map((user) => new mongoose_1.Types.ObjectId(user._id));
    }
    async findUserByEmail(email) {
        return this.userModel.findOne({ email }).exec();
    }
    async changeEmail(username, password, newEmail) {
        const user = await this.userModel.findOne({ username });
        if (!user) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.NOT_FOUND);
        }
        if (user.password !== password) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.PasswordNotFound, common_1.HttpStatus.NOT_FOUND);
        }
        if (user.email === newEmail) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.EmailSame, common_1.HttpStatus.CONFLICT);
        }
        const emailExists = await this.userModel.findOne({ email: newEmail });
        if (emailExists) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.EmailAlreadyExists, common_1.HttpStatus.CONFLICT);
        }
        user.email = newEmail;
        await user.save();
    }
    async changePassword(username, currentPassword, newPassword, verifyPassword) {
        const user = await this.userModel.findOne({ username });
        if (!user) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.NOT_FOUND);
        }
        if (currentPassword !== user.password) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.PasswordNotFound, common_1.HttpStatus.NOT_FOUND);
        }
        if (newPassword === currentPassword) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.PasswordSame, common_1.HttpStatus.CONFLICT);
        }
        if (newPassword !== verifyPassword) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.PasswordNotEqual, common_1.HttpStatus.BAD_REQUEST);
        }
        user.password = newPassword;
        await user.save();
    }
    async updateProfilePicture(username, profilePicturePath) {
        const user = await this.userModel.findOne({ username });
        if (!user) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.NOT_FOUND);
        }
        user.profilePicture = profilePicturePath;
        await user.save();
    }
    async updateConnectionStartTime(userId, startTime) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.UNAUTHORIZED);
            }
            user.connectionStartTime = startTime;
            await user.save();
        }
        catch (error) {
            throw new Error('Error updating user connection time.');
        }
    }
    async updateLastSeen(username, lastSeen, isOnline) {
        try {
            const user = await this.userModel.findOne({ username }).exec();
            if (!user) {
                throw new Error('User not found.');
            }
            user.lastSeen = lastSeen;
            user.isOnline = isOnline;
            await user.save();
        }
        catch (error) {
            throw new Error('Error updating lastSeen in updateLastSeen.');
        }
    }
    async deleteUser(username) {
        const result = await this.userModel.deleteOne({ username }).exec();
        if (result.deletedCount === 0) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.NOT_FOUND);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_1.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map