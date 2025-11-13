import { Meeting } from "@prisma/client";
import { meetingsRepository } from "repositories/meetings.repository";

export const meetingsService = {
    async createMeeting(ownerId: string, title: string, isPlanned: boolean, startTime?: Date): Promise<Meeting> {
        try {
            const meeting: Omit<Meeting, "id" | "endTime"> = {
                ownerId,
                title,
                isPlanned,
                isStarted: !isPlanned,
                startTime: startTime || null,
            };

            return await meetingsRepository.createMeeting(meeting);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
}