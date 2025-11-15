import { Meeting, PrismaClient } from "@prisma/client";

const prisma: PrismaClient = new PrismaClient();

export const meetingsRepository = {
    async createMeeting(meeting: Omit<Meeting, "id" | "endTime" | "code">): Promise<Meeting> {
        return await prisma.meeting.create({
            data: meeting
        });
    },

    async updateMeetingCode(meetingId: string, newCode: string): Promise<void> {
        await prisma.meeting.update({
            where: {
                id: meetingId
            },
            data: {
                code: newCode
            }
        });
    },

    async getMeetingByCode(meetingCode: string): Promise<Meeting | null> {
        return await prisma.meeting.findUnique({
            where: {
                code: meetingCode
            }
        });
    },

    async getRecentMeetings(userId: string): Promise<{ meeting: Pick<Meeting, "id" | "title" | "code">, addedAt: Date }[]> {
        return await prisma.recentMeeting.findMany({
            where: {
                userId: userId
            },
            select: {
                meeting: {
                    select: {
                        id: true,
                        title: true,
                        code: true
                    }
                },
                addedAt: true
            },
            orderBy: {
                addedAt: "desc"
            },
        });
    },

    async addMeetingToRecent(userId: string, meetingId: string): Promise<void> {
        await prisma.recentMeeting.upsert({
            where: {
                userId_meetingId: {
                    userId: userId,
                    meetingId: meetingId
                }
            },
            update: {
                addedAt: new Date()
            },
            create: {
                userId: userId,
                meetingId: meetingId
            }
        });

    }
}