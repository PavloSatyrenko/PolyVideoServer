import { ChatMessage, User } from "@prisma/client";
import { chatsRepository } from "repositories/chats.repository";

type ChatWithRecieverAndSender = ChatMessage & { receiver: Omit<User, "passwordHash">, sender: Omit<User, "passwordHash"> };
type ChatWithUser = ChatMessage & { user: Omit<User, "passwordHash"> };

export const chatsService = {
    async getChatsByUserId(userId: string): Promise<ChatWithUser[]> {
        const userIds: Set<string> = new Set<string>();

        const allRecentChats: ChatWithUser[] = (await chatsRepository.getChatsByUserId(userId))
            .map((chat: ChatWithRecieverAndSender) => {
                const { receiver, sender, ...restChat } = chat;

                return {
                    ...restChat,
                    user: chat.senderId === userId ? receiver : sender
                };
            });

        return allRecentChats.filter((chat: ChatWithUser) => {
            const userId: string = chat.user.id;

            if (userIds.has(userId)) {
                return false;
            }

            userIds.add(userId);

            return true;
        });
    },

    async sendMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage> {
        return await chatsRepository.createMessage(senderId, receiverId, content);
    },

    async getMessagesBetweenUsers(userId: string, chatUserId: string, beforeMessageId?: string): Promise<{ messages: ChatMessage[], hasMore: boolean }> {
        const { messages, hasMore } = await chatsRepository.getMessagesBetweenUsers(userId, chatUserId, beforeMessageId);

        return {
            messages: messages.reverse(),
            hasMore
        };
    }
}