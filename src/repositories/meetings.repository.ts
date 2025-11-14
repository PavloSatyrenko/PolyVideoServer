import { Meeting, PrismaClient } from "@prisma/client";

const prisma: PrismaClient = new PrismaClient();

export const meetingsRepository = {
    async createMeeting(meeting: Omit<Meeting, "id" | "endTime">): Promise<Meeting> {
        return await prisma.meeting.create({
            data: meeting
        });
    },

    async getMeetingById(meetingId: string): Promise<Meeting | null> {
        return await prisma.meeting.findUnique({
            where: {
                id: meetingId
            }
        });
    }
}