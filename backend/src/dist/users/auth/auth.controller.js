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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("./auth.service");
const login_1 = require("../dto/login");
const users_exception_1 = require("../users-exception");
const users_service_1 = require("../users.service");
let AuthController = class AuthController {
    constructor(authService, userService, jwtService) {
        this.authService = authService;
        this.userService = userService;
        this.jwtService = jwtService;
    }
    async getConnectionTime(username, res) {
        try {
            if (!username) {
                return res
                    .status(common_1.HttpStatus.BAD_REQUEST)
                    .json({ message: 'A valid username was not provided.' });
            }
            if (username) {
                const connectionTime = await this.authService.getConnectionTime(username);
                return res.status(common_1.HttpStatus.OK).json({ connectionTime });
            }
            else {
                throw new Error('A valid username was not provided in the request.');
            }
        }
        catch (error) {
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Error obtaining connection time.' });
        }
    }
    async login(loginDto, res) {
        const { username, password } = loginDto;
        const token = await this.authService.login(username, password);
        if (!token) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.CredentialInvalid, common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.userService.updateLastSeen(username, new Date(), true);
        const user = await this.userService.findUserByUserName(username);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(common_1.HttpStatus.OK).json({
            token: token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                gamesPlayed: user.gamesPlayed,
                gamesWon: user.gamesWon,
                gamesLost: user.gamesLost,
                lastSeen: user.lastSeen,
                isOnline: user.isOnline,
                connectionStartTime: user.connectionStartTime,
            },
        });
    }
    async verifyToken(req, res) {
        const { token } = req.cookies;
        const userData = await this.authService.verifyToken(token);
        return res.status(common_1.HttpStatus.OK).json(userData);
    }
    async refreshToken(request) {
        try {
            const tokens = request.cookies;
            if (!tokens || !tokens.token) {
                throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.TokenInvalid, common_1.HttpStatus.UNAUTHORIZED);
            }
            const newToken = await this.authService.refreshToken(tokens.token);
            return { token: newToken };
        }
        catch (error) {
            throw new users_exception_1.UserValidationException(users_exception_1.UserValidationError.TokenInvalid, common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    async logout(req, res) {
        try {
            res.clearCookie('token');
            const { token } = req.cookies;
            if (token) {
                const decodedToken = this.jwtService.decode(token);
                if (decodedToken) {
                    const username = decodedToken.username;
                    await this.userService.updateLastSeen(username, new Date(), false);
                }
            }
            return res.status(common_1.HttpStatus.OK).json({
                message: 'You have logged out. We hope you will be back soon!',
            });
        }
        catch (error) {
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Logout error.' });
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('/:username/connection-time'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getConnectionTime", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-token'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyToken", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map