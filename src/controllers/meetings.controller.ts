import { Meeting } from "@prisma/client";
import { Request, Response } from "express";
import { meetingsService } from "services/meetings.service";

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
    }
}