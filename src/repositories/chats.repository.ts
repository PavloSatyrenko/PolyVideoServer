import { ChatMessage, PrismaClient, User } from "@prisma/client";

const prisma: PrismaClient = new PrismaClient();

type LastMessageType = { senderId: string, receiverId: string, _max: { sentAt: Date } };
type ChatWithRecieverAndSender = ChatMessage & { receiver: Omit<User, "passwordHash">, sender: Omit<User, "passwordHash"> };

export const chatsRepository = {
    async getChatsByUserId(userId: string): Promise<ChatWithRecieverAndSender[]> {
        const lastMessages: LastMessageType[] = await prisma.chatMessage.groupBy({
            by: ["receiverId", "senderId"],
            where: {
                OR: [
                    {
                        senderId: userId
                    },
                    {
                        receiverId: userId
                    }
                ]
            },
            _max: {
                sentAt: true
            }
        }) as any as LastMessageType[];

        return await prisma.chatMessage.findMany({
            where: {
                OR: lastMessages.map((message: LastMessageType) => ({
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    sentAt: message._max.sentAt
                }))
            },
            include: {
                receiver: {
                    omit: {
                        passwordHash: true
                    }
                },
                sender: {
                    omit: {
                        passwordHash: true
                    }
                }
            },
            orderBy: {
                sentAt: "desc"
            }
        });
    },

    async createMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage> {
        return await prisma.chatMessage.create({
            data: {
                senderId,
                receiverId,
                content,
            }
        });
    },

    async getMessagesBetweenUsers(userId: string, chatUserId: string, beforeMessageId?: string): Promise<ChatMessage[]> {
        let beforeMessage: ChatMessage | null = null;

        if (beforeMessageId) {
            beforeMessage = await prisma.chatMessage.findUnique({
                where: {
                    id: beforeMessageId,
                }
            });
        }

        return await prisma.chatMessage.findMany({
            where: {
                OR: [
                    {
                        senderId: userId,
                        receiverId: chatUserId,
                    },
                    {
                        senderId: chatUserId,
                        receiverId: userId,
                    }
                ],
                ...(
                    beforeMessage ? {
                        sentAt: {
                            lt: beforeMessage.sentAt,
                        }
                    } : {}
                )
            },
            orderBy: {
                sentAt: "desc"
            },
            take: 20
        });
    }
}