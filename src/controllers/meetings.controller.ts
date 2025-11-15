import { Meeting } from "@prisma/client";
import { Request, Response } from "express";
import { meetingsService } from "services/meetings.service";

type RecentMeetingType = {
    id: string,
    code: string,
    name: string,
    lastTimeJoined: Date
}

export const meetingsController = {
    async createMeeting(request: Request, response: Response): Promise<void> {
        try {
            const title: string = request.body.title;
            const isPlanned: boolean = request.body.isPlanned;
            const startTime: Date | undefined = request.body.startTime ? new Date(request.body.startTime) : undefined;
            const ownerId: string = request.user!.id;

            const meeting: Meeting = await meetingsService.createMeeting(ownerId, title, isPlanned, startTime);

            response.status(201).json(meeting);
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async getMeetingByCode(request: Request, response: Response): Promise<void> {
        try {
            const meetingCode: string = request.params.meetingCode;

            const meeting: Meeting | null = await meetingsService.getMeetingByCode(meetingCode);

            if (!meeting) {
                response.status(404).json({ message: "Meeting not found" });
                return;
            }

            response.status(200).json(meeting);
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async getRecentMeetings(request: Request, response: Response): Promise<void> {
        try {
            const userId: string = request.user!.id;

            const recentMeetings: RecentMeetingType[] = await meetingsService.getRecentMeetings(userId);

            response.status(200).json(recentMeetings);
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async addMeetingToRecent(request: Request, response: Response): Promise<void> {
        try {
            const meetingCode: string = request.params.meetingCode;
            const userId: string = request.user!.id;

            const isAdded: boolean = await meetingsService.addMeetingToRecent(userId, meetingCode);

            if (!isAdded) {
                response.status(404).json({ message: "Meeting not found" });
                return;
            }

            response.status(200).json({ message: "Meeting added to recent successfully" });
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    }
}