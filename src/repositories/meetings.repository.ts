import { Meeting, PrismaClient } from "@prisma/client";

const prisma: PrismaClient = new PrismaClient();

export const meetingsRepository = {
    async createMeeting(meeting: Omit<Meeting, "id">): Promise<Meeting> {
        return await prisma.meeting.create({
            data: meeting
        });
    }
}