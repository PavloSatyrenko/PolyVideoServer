import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { PORT } from "./config/env";
import { Server } from "http";
import { Server as ioServer, Namespace, Socket } from "socket.io";
import { jwt } from "utils/jwt";
import { authService } from "services/auth.service";
import { User } from "@prisma/client";
import { meetingsService } from "services/meetings.service";

const server: Server = app.listen(PORT, () => {
    console.log("Server listening on port " + PORT);
});

const io: ioServer = new ioServer(server, {
    cors: {
        origin: ["http://localhost:4200", "https://polyvideo-1ca6f.web.app"],
        credentials: true
    }
});

const meetingNamespace: Namespace = io.of("/meeting");

meetingNamespace.on("connection", (socket: Socket) => {
    console.log("Socket connected: " + socket.id);

    socket.on("join", async (data: { roomCode: string, name: string }) => {
        socket.join(data.roomCode);
        socket.data.roomId = data.roomCode;

        const cookies: Map<string, string> = new Map();

        socket.request.headers.cookie?.split("; ").forEach((string: string) => {
            const [key, value]: string[] = string.split("=");
            cookies.set(key, value);
        });

        const accessToken: string | undefined = cookies.get("__Secure-AccessToken");

        if (accessToken) {
            const userId: string | undefined = jwt.verifyAccessToken(accessToken)?.id;

            if (userId) {
                const user: Omit<User, "passwordHash"> | null = await authService.getAuthorizedUser(userId);

                if (user) {
                    socket.data.name = `${user.name} ${user.surname}`;
                    socket.data.userId = user.id;
                }
            }
        }
        else {
            socket.data.name = data.name;
        }

        socket.to(data.roomCode).emit("new-user", { socketId: socket.id, name: data.name });

        socket.emit("all-users", Array.from(meetingNamespace.adapter.rooms.get(data.roomCode) ?? [])
            .filter((socketId: string) => socketId !== socket.id)
            .map((socketId: string) => ({
                socketId: socketId,
                name: meetingNamespace.sockets.get(socketId)!.data.name,
                isHandUp: meetingNamespace.sockets.get(socketId)!.data.isHandUp
            }))
        );
    });

    socket.on("offer", (data: { socketId: string, offer: RTCSessionDescriptionInit }) => {
        meetingNamespace.to(data.socketId).emit("offer", { socketId: socket.id, offer: data.offer });
    })

    socket.on("answer", (data: { socketId: string, answer: RTCSessionDescriptionInit }) => {
        meetingNamespace.to(data.socketId).emit("answer", { socketId: socket.id, answer: data.answer });
    });

    socket.on("iceCandidate", (data: { socketId: string, candidate: RTCIceCandidate }) => {
        meetingNamespace.to(data.socketId).emit("iceCandidate", { socketId: socket.id, candidate: data.candidate });
    });

    socket.on("meeting-info-updated", (data: { title: string, isWaitingRoom: boolean, isScreenSharing: boolean, isGuestAllowed: boolean }) => {
        socket.to(socket.data.roomId).emit("meeting-info-updated", data);
    });

    socket.on("mute", () => {
        socket.to(socket.data.roomId).emit("mute", socket.id);
    });

    socket.on("unmute", () => {
        socket.to(socket.data.roomId).emit("unmute", socket.id);
    });

    socket.on("disable-video", () => {
        socket.to(socket.data.roomId).emit("disable-video", socket.id);
    });

    socket.on("enable-video", () => {
        socket.to(socket.data.roomId).emit("enable-video", socket.id);
    });

    socket.on("start-screen-share", () => {
        socket.to(socket.data.roomId).emit("start-screen-share", socket.id);
    });

    socket.on("stop-screen-share", () => {
        socket.to(socket.data.roomId).emit("stop-screen-share", socket.id);
    });

    socket.on("hand-up", () => {
        socket.data.isHandUp = true;
        socket.to(socket.data.roomId).emit("hand-up", socket.id);
    });

    socket.on("hand-down", () => {
        socket.data.isHandUp = false;
        socket.to(socket.data.roomId).emit("hand-down", socket.id);
    });

    socket.on("mute-user", async (socketId: string) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomId, socket.data.userId || "");

            if (!isOwner) {
                return;
            }
        }
        catch {
            return;
        }

        meetingNamespace.to(socketId).emit("muted-by-owner");
    });

    socket.on("unmute-user", async (socketId: string) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomId, socket.data.userId || "");

            if (!isOwner) {
                return;
            }
        }
        catch {
            return;
        }

        meetingNamespace.to(socketId).emit("requested-unmute-by-owner");
    });

    socket.on("disable-video-user", async (socketId: string) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomId, socket.data.userId || "");

            if (!isOwner) {
                return;
            }
        }
        catch {
            return;
        }

        meetingNamespace.to(socketId).emit("video-disabled-by-owner");
    });

    socket.on("enable-video-user", async (socketId: string) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomId, socket.data.userId || "");

            if (!isOwner) {
                return;
            }   
        }
        catch {
            return;
        }

        meetingNamespace.to(socketId).emit("requested-enable-video-by-owner");
    });

    socket.on("remove-user", async (socketId: string) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomId, socket.data.userId || "");

            if (!isOwner) {
                return;
            }
        }
        catch {
            return;
        }

        meetingNamespace.to(socketId).emit("removed-from-meeting");
    });

    socket.on("chat-message", (message: { id: string, senderName: string, content: string }) => {
        socket.to(socket.data.roomId).emit("chat-message", message);
    });

    socket.on("leave", (roomId: string) => {
        socket.to(roomId).emit("user-leave", socket.id);

        socket.leave(roomId);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected: " + socket.id);

        if (socket.data.roomId) {
            socket.to(socket.data.roomId).emit("user-leave", socket.id);
        }
    })
});
