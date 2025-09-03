import { jwt } from "utils/jwt";
import { RefreshToken, User } from "@prisma/client";
import bcrypt from "bcrypt";
import { authRepository } from "repositories/auth.repository";

export const authService = {
    async signUpUser(email: string, name: string, surname: string, password: string): Promise<{ accessToken: string, refreshToken: string } | null> {
        try {
            const existingUser: User | null = await authRepository.findUserByEmail(email);

            if (existingUser) {
                return null;
            }

            const passwordHash: string = await bcrypt.hash(password, 12);

            const newUser: Omit<User, "id"> = {
                name,
                surname,
                email: email,
                passwordHash
            };

            const user: User = await authRepository.createUser(newUser);

            const accessToken: string = jwt.generateAccessToken(user.id);
            const refreshToken: string = jwt.generateRefreshToken(user.id);

            await authRepository.createRefreshToken(refreshToken, user.id);

            return { accessToken, refreshToken };
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    },

    async loginUser(email: string, password: string): Promise<{ accessToken: string, refreshToken: string } | null> {
        try {
            const user: User | null = await authRepository.findUserByEmail(email);

            if (!user || !(bcrypt.compareSync(password, user.passwordHash))) {
                return null;
            }

            const accessToken: string = jwt.generateAccessToken(user.id);
            const refreshToken: string = jwt.generateRefreshToken(user.id);

            await authRepository.createRefreshToken(refreshToken, user.id);

            return { accessToken, refreshToken };
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    },

    async getAuthorizedUser(userId: string): Promise<Omit<User, "passwordHash"> | null> {
        try {
            const user: Omit<User, "passwordHash"> | null = await authRepository.findUserById(userId);
            return user;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    },

    async refreshAccessToken(refreshToken: string): Promise<string | null> {
        try {
            const existingRefreshToken: RefreshToken | null = await authRepository.findRefreshToken(refreshToken);

            if (!existingRefreshToken) {
                return null;
            }

            const user: { id: string } = jwt.verifyRefreshToken(refreshToken);

            const accessToken: string = jwt.generateAccessToken(user.id);

            return accessToken;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
}