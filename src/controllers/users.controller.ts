import { User } from "@prisma/client";
import { Request, Response } from "express";
import { usersService } from "services/users.service";

export const usersController = {
    async getUsersToChat(request: Request, response: Response): Promise<void> {
        try {
            const searchQuery: string | undefined = request.query.search as string | undefined;
            const userId: string = request.user!.id as string;

            const users: Omit<User, "passwordHash">[] = await usersService.getUsersToChat(userId, searchQuery);

            response.status(200).json(users);
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    }
}