import { User } from "@prisma/client";
import { usersRepository } from "repositories/users.repository";

export const usersService = {
    async getUsersToChat(userId: string, searchQuery?: string): Promise<Omit<User, "passwordHash">[]> {
        return await usersRepository.getUsers(userId, searchQuery);
    }
}