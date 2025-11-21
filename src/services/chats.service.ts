import { ChatMessage, User } from "@prisma/client";
import { chatsRepository } from "repositories/chats.repository";

type ChatWithRecieverAndSender = ChatMessage & { receiver: Omit<User, "passwordHash">, sender: Omit<User, "passwordHash"> };
type ChatWithUser = ChatMessage & { user: Omit<User, "passwordHash"> };

export const chatsService = {
    async getChatsByUserId(userId: string): Promise<ChatWithUser[]> {
        const userIds: Set<string> = new Set();

        const allRecentChats: ChatWithUser[] = (await chatsRepository.getChatsByUserId(userId))
            .map((chat: ChatWithRecieverAndSender) => {
                const { receiver, sender, ...restChat } = chat;

                return {
                    ...restChat,
                    user: chat.senderId === userId ? chat.receiver : chat.sender
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

    async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
        await chatsRepository.createMessage(senderId, receiverId, content);
    },

    async getMessagesBetweenUsers(userId: string, chatUserId: string, afterMessageId?: string): Promise<ChatMessage[]> {
        return (await chatsRepository.getMessagesBetweenUsers(userId, chatUserId, afterMessageId)).reverse();
    }
}