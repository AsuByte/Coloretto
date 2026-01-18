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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users.service");
const users_exception_1 = require("../users-exception");
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async getConnectionTime(username) {
        try {
            const user = await this.usersService.findUserByUserName(username);
            if (!user) {
                return null;
            }
            if (user.isOnline) {
                return `Online.`;
            }
            else {
                const lastSeen = user.lastSeen;
                if (lastSeen) {
                    const elapsedTime = await this.calculateElapsedTime(new Date(lastSeen));
                    const timeString = await this.calculateElapsedTimeString(elapsedTime);
                    return `Connected ago ${timeString}.`;
                }
                else {
                    return 'Never Connected.';
                }
            }
        }
        catch (error) {
            throw new Error('Error obtaining connection time.');
        }
    }
    async calculateElapsedTime(lastSeen) {
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - lastSeen.getTime();
        return elapsedTime;
    }
    async calculateElapsedTimeString(elapsedTime) {
        const seconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        let timeString = '';
        if (days > 0) {
            timeString += `${days}d`;
        }
        else if (hours > 0) {
            timeString += `${hours}h`;
        }
        else if (minutes > 0) {
            timeString += `${minutes}m`;
        }
        else {
            timeString += `${seconds}s`;
        }
        return timeString;
    }
    async login(username, password) {
        const user = await this.usersService.findUserByUserName(username);
        if (!user) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.NOT_FOUND);
        }
        if (password !== user.password) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.PasswordIncorrect, common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.usersService.updateConnectionStartTime(user._id, new Date());
        const payload = { username: user.username, sub: user._id };
        return this.jwtService.sign(payload);
    }
    async generateToken(userId) {
        const payload = { sub: userId };
        return this.jwtService.sign(payload);
    }
    async getUserIdFromSocket(client) {
        try {
            const token = client.handshake.headers.authorization.replace('Bearer ', '');
            const { sub: userId } = this.jwtService.verify(token);
            return userId;
        }
        catch (error) {
            console.error('Error obtaining socket ID:', error.message);
            throw new common_1.UnauthorizedException('Invalid authentication token.');
        }
    }
    async verifyToken(token) {
        try {
            const decoded = this.jwtService.verify(token);
            const user = await this.usersService.findById(decoded.sub);
            return { _id: user._id, username: user.username, email: user.email };
        }
        catch (error) {
            return null;
        }
    }
    async refreshToken(token) {
        try {
            const decoded = this.jwtService.verify(token);
            const user = await this.usersService.findById(decoded.sub);
            if (!user) {
                throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.UNAUTHORIZED);
            }
            const newToken = await this.generateToken(user._id);
            return newToken;
        }
        catch (error) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.TokenInvalid, common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    async logout(username) {
        try {
            const user = await this.usersService.findUserByUserName(username);
            if (!user) {
                throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.UserNotFound, common_1.HttpStatus.UNAUTHORIZED);
            }
            user.lastSeen = new Date();
            user.isOnline = false;
            await this.usersService.updateLastSeen(username, user.lastSeen, user.isOnline);
        }
        catch (error) {
            throw new Error('Logout error.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map