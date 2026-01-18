import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/users/users.service';
import { Socket } from 'socket.io';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    getConnectionTime(username: string): Promise<string>;
    calculateElapsedTime(lastSeen: Date): Promise<number>;
    calculateElapsedTimeString(elapsedTime: number): Promise<string>;
    login(username: string, password: string): Promise<string | null>;
    generateToken(userId: string): Promise<string>;
    getUserIdFromSocket(client: Socket): Promise<string>;
    verifyToken(token: string): Promise<{
        _id: string;
        username: string;
        email: string;
    }>;
    refreshToken(token: string): Promise<string>;
    logout(username: string): Promise<void>;
}
