import { PrismaClient, User } from "@prisma/client";

const prisma: PrismaClient = new PrismaClient();

export const usersRepository = {
    async getUsers(userId: string, searchQuery?: string): Promise<Omit<User, "passwordHash">[]> {
        const words: string[] = searchQuery?.split(/\s+/).filter(Boolean) || [];

        return await prisma.user.findMany({
            where: {
                ...(
                    searchQuery && {
                        AND: words.map((word: string) => ({
                            OR: [
                                {
                                    name: {
                                        startsWith: word,
                                        mode: "insensitive"
                                    }
                                },
                                {
                                    surname: {
                                        startsWith: word,
                                        mode: "insensitive"
                                    }
                                },
                            ]
                        }))
                    }
                ),
                NOT: {
                    id: userId
                }
            },
            omit: {
                passwordHash: true
            },
            take: 10,
            orderBy: [
                {
                    name: "asc"
                },
                {
                    surname: "asc"
                }
            ]
        });
    }
}