import { Meeting } from "@prisma/client";
import { meetingsRepository } from "repositories/meetings.repository";

export const meetingsService = {
    async createMeeting(ownerId: string, title: string, isPlanned: boolean, startTime?: Date): Promise<Meeting> {
        try {
            const meeting: Omit<Meeting, "id" | "endTime" | "code"> = {
                ownerId,
                title,
                isPlanned,
                isStarted: !isPlanned,
                startTime: startTime || null,
            };

            const createdMeeting: Meeting = await meetingsRepository.createMeeting(meeting);

            const newCode: string = Buffer.from(createdMeeting.id).toString("base64").replace(/[^A-Z0-9]/gi, "").slice(0, 10);
            await meetingsRepository.updateMeetingCode(createdMeeting.id, newCode);

            createdMeeting.code = newCode;

            return createdMeeting;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    },

    async getMeetingByCode(meetingCode: string): Promise<Meeting | null> {
        return await meetingsRepository.getMeetingByCode(meetingCode);
    }
}