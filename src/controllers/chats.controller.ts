import { ChatMessage, User } from "@prisma/client";
import { Request, Response } from "express";
import { chatsService } from "services/chats.service";

type ChatWithUser = ChatMessage & { user: Omit<User, "passwordHash"> };

export const chatsController = {
    async getChats(request: Request, response: Response): Promise<void> {
        try {
            const userId: string = request.user!.id;

            const chats: ChatWithUser[] = await chatsService.getChatsByUserId(userId);

            response.status(200).json(chats);
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async sendMessage(request: Request, response: Response): Promise<void> {
        try {
            const receiverId: string = request.body.receiverId;
            const content: string = request.body.content;
            const userId: string = request.user!.id;

            await chatsService.sendMessage(userId, receiverId, content);

            response.status(200).json({ message: "Message sent successfully" });
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async getMessages(request: Request, response: Response): Promise<void> {
        try {
            const chatUserId: string = request.params.chatUserId;
            const beforeMessageId: string | undefined = request.query.before as string | undefined;
            const userId: string = request.user!.id;

            const messages: ChatMessage[] = await chatsService.getMessagesBetweenUsers(userId, chatUserId, beforeMessageId);

            response.status(200).json(messages);
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },
};