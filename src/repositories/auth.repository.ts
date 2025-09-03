import { PrismaClient, RefreshToken, User } from "@prisma/client";

const prisma: PrismaClient = new PrismaClient();

export const authRepository = {
    async createUser(user: Omit<User, "id">): Promise<User> {
        return prisma.user.create({
            data: user
        });
    },

    async findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: {
                email: email
            }
        });
    },

    async findUserById(id: string): Promise<Omit<User, "passwordHash"> | null> {
        return prisma.user.findUnique({
            where: {
                id: id
            },
            omit: {
                passwordHash: true
            }
        });
    },

    async createRefreshToken(refreshToken: string, userId: string): Promise<void> {
        prisma.refreshToken.create({
            data: {
                refreshToken: refreshToken,
                userId: userId
            }
        });
    },

    async findRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
        return prisma.refreshToken.findUnique({ where: { refreshToken: refreshToken } });
    }
}