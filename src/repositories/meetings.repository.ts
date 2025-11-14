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
    }
}