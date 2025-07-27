import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { UserType } from "types/user.type";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "utils/jwt";
import { RefreshTokenType } from "types/refreshToken.type";

const prisma: PrismaClient = new PrismaClient();

export async function signUpUser(email: string, password: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    try {
        const existingUser: UserType | null = await prisma.user.findUnique({ where: { email: email } });

        if (existingUser) {
            return null;
        }

        const passwordHash: string = await bcrypt.hash(password, 12);

        const user: UserType = await prisma.user.create({
            data: { email, passwordHash }
        });

        const accessToken: string = generateAccessToken(user.id);
        const refreshToken: string = generateRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: { refreshToken: refreshToken, userId: user.id }
        });

        return { accessToken, refreshToken };
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

export async function loginUser(email: string, password: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    try {
        const user: UserType | null = await prisma.user.findUnique({ where: { email: email } });

        if (!user || !(bcrypt.compareSync(password, user.passwordHash))) {
            return null;
        }

        const accessToken: string = generateAccessToken(user.id);
        const refreshToken: string = generateRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: { refreshToken: refreshToken, userId: user.id }
        });

        return { accessToken, refreshToken };
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
        const existingRefreshToken: RefreshTokenType | null = await prisma.refreshToken.findUnique({ where: { refreshToken: refreshToken } });

        if (!existingRefreshToken) {
            return null;
        }

        const userId: number = verifyRefreshToken(refreshToken).id;

        const accessToken: string = generateAccessToken(userId);

        return accessToken;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}