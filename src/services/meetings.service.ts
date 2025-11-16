import { Meeting } from "@prisma/client";
import { meetingsRepository } from "repositories/meetings.repository";

type RecentMeetingType = {
    id: string,
    code: string,
    name: string,
    lastTimeJoined: Date
}

export const meetingsService = {
    async createMeeting(ownerId: string, title: string, isPlanned: boolean, startTime?: Date): Promise<Meeting> {
        try {
            const meeting: Omit<Meeting, "id" | "endTime" | "code"> = {
                ownerId,
                title,
                isPlanned,
                isStarted: !isPlanned,
                startTime: startTime || new Date(),
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
    },

    async getRecentMeetings(userId: string): Promise<RecentMeetingType[]> {
        const recentMeetings: { meeting: Pick<Meeting, "id" | "title" | "code">, addedAt: Date }[] = await meetingsRepository.getRecentMeetings(userId);

        return recentMeetings.map((recentMeeting: { meeting: Pick<Meeting, "id" | "title" | "code">, addedAt: Date }) => ({
            id: recentMeeting.meeting.id,
            code: recentMeeting.meeting.code!,
            name: recentMeeting.meeting.title,
            lastTimeJoined: recentMeeting.addedAt
        }));
    },

    async addMeetingToRecent(userId: string, meetingCode: string): Promise<boolean> {
        const meeting: Meeting | null = await meetingsRepository.getMeetingByCode(meetingCode);

        if (!meeting) {
            return false;
        }

        await meetingsRepository.addMeetingToRecent(userId, meeting.id);
        return true;
    },

    async getOwnedMeetings(userId: string): Promise<Meeting[]> {
        return (await meetingsRepository.getOwnedMeetings(userId))
            .sort((a, b) => {
                if ((!a.isStarted && !a.endTime) && b.isStarted) {
                    return -1;
                }

                if (a.isStarted && (!b.isStarted && !b.endTime)) {
                    return 1;
                }

                if ((a.isStarted && !a.endTime) && b.endTime) {
                    return -1;
                }

                if (a.endTime && (b.isStarted && !b.endTime)) {
                    return 1;
                }

                return Math.abs(a.startTime.getTime() - Date.now()) - Math.abs(b.startTime.getTime() - Date.now())
            });
    },

    async startMeeting(meetingCode: string, userId: string): Promise<number> {
        const meeting: Meeting | null = await meetingsRepository.getMeetingByCode(meetingCode);

        if (!meeting) {
            return 404;
        }

        if (meeting.isStarted) {
            return 400;
        }

        if (meeting.ownerId !== userId) {   
            return 403;
        }

        await meetingsRepository.startMeeting(meeting.id);

        return 200;
    },        
}