import { Model, Types } from 'mongoose';
import { User, UserDocument } from '@/users/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    getAllUsers(): Promise<User[]>;
    getAllUsernames(): Promise<string[]>;
    areThereAnyUsers(): Promise<boolean>;
    createUser(fullname: string, username: string, email: string, password: string, profilePicture: string): Promise<User>;
    findById(_id: string): Promise<User | undefined>;
    findUserByUserName(username: string): Promise<User | undefined>;
    findUserIdsByUsernames(usernames: string[]): Promise<Types.ObjectId[]>;
    findUserByEmail(email: string): Promise<User | undefined>;
    changeEmail(username: string, password: string, newEmail: string): Promise<void>;
    changePassword(username: string, currentPassword: string, newPassword: string, verifyPassword: string): Promise<void>;
    updateProfilePicture(username: string, profilePicturePath: string): Promise<void>;
    updateConnectionStartTime(userId: string, startTime: Date): Promise<void>;
    updateLastSeen(username: string, lastSeen: Date | null, isOnline: boolean): Promise<void>;
    deleteUser(username: string): Promise<void>;
}
