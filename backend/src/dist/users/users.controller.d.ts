import { UsersService } from '@/users/users.service';
import { AuthService } from '@/users/auth/auth.service';
import { UploadService } from '@/users/upload.service';
export declare class UsersController {
    private readonly usersService;
    private readonly authService;
    private readonly uploadService;
    private static readonly DEFAULT_PROFILE_PICTURE;
    constructor(usersService: UsersService, authService: AuthService, uploadService: UploadService);
    getAllUsernames(): Promise<string[]>;
    getProfile(username: string): Promise<import("./user.schema").User>;
    register(fullname: string, username: string, email: string, password: string): Promise<{
        message: string;
        token: string;
    }>;
    changeEmail(username: string, password: string, newEmail: string): Promise<{
        message: string;
    }>;
    changePassword(username: string, currentPassword: string, newPassword: string, verifyPassword: string): Promise<{
        message: string;
    }>;
    updateProfilePicture(username: string, file: Express.Multer.File): Promise<{
        message: string;
    }>;
    deleteUser(username: string): Promise<{
        message: string;
    }>;
}
