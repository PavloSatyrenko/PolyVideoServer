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

meetingNamespace.use(async (socket: Socket, next) => {
    const cookies: Map<string, string> = new Map();

    socket.request.headers.cookie?.split("; ").forEach((string: string) => {
        const [key, value]: string[] = string.split("=");
        cookies.set(key, value);
    });

    const accessToken: string | undefined = cookies.get("__Secure-AccessToken");
    const refreshToken: string | undefined = cookies.get("__Secure-RefreshToken");

    let userId: string | undefined = undefined;

    if (accessToken) {
        try {
            userId = jwt.verifyAccessToken(accessToken)?.id;
        }
        catch {
            userId = undefined;
        }
    }

    if (!userId && refreshToken) {
        let newAccessToken: string | null;

        try {
            newAccessToken = await authService.refreshAccessToken(refreshToken);
        }
        catch {
            newAccessToken = null;
        }

        if (newAccessToken) {
            userId = jwt.verifyAccessToken(newAccessToken)?.id;
        }
    }

    if (userId) {
        const user: Omit<User, "passwordHash"> | null = await authService.getAuthorizedUser(userId);

        if (user) {
            socket.data.name = `${user.name} ${user.surname}`;
            socket.data.userId = user.id;
        }
    }

    next();
});

meetingNamespace.on("connection", async (socket: Socket) => {
    socket.on("join", async (data: { roomCode: string, name: string }) => {
        socket.join(data.roomCode);
        socket.data.roomId = data.roomCode;

        if (!socket.data.name) {
            socket.data.name = data.name;
        }

        socket.to(data.roomCode).emit("new-user", { socketId: socket.id, name: socket.data.name });

        if (socket.data.userId) {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(data.roomCode, socket.data.userId);

            if (isOwner) {
                socket.to(data.roomCode).emit("owner-joined");
            }
        }

        socket.emit("all-users", Array.from(meetingNamespace.adapter.rooms.get(data.roomCode) ?? [])
            .filter((socketId: string) => socketId !== socket.id)
            .map((socketId: string) => ({
                socketId: socketId,
                name: meetingNamespace.sockets.get(socketId)!.data.name,
                isHandUp: meetingNamespace.sockets.get(socketId)!.data.isHandUp
            }))
        );
    });

    socket.on("request-to-join", async (data: { roomCode: string, name: string }) => {
        const ownerId: string = (await meetingsService.getMeetingByCode(data.roomCode))?.ownerId || "";

        if (ownerId === socket.data.userId) {
            socket.emit("request-approved");
            return;
        }

        const ownerSocketId: string = Array.from(meetingNamespace.adapter.rooms.get(data.roomCode) ?? [])
            .find((socketId: string) => {
                const userId: string | undefined = meetingNamespace.sockets.get(socketId)!.data.userId;

                if (!userId) {
                    return false;
                }

                return userId === ownerId;
            }) || "";

        if (ownerSocketId) {
            meetingNamespace.to(ownerSocketId).emit("join-request", { socketId: socket.id, name: data.name });
        }
        else {
            socket.emit("owner-not-found");
        }
    });

    socket.on("approve-request", (socketId: string) => {
        meetingNamespace.to(socketId).emit("request-approved");
    });

    socket.on("deny-request", (socketId: string) => {
        meetingNamespace.to(socketId).emit("request-denied");
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

    socket.on("disconnect", async () => {
        if (socket.data.roomId) {
            socket.to(socket.data.roomId).emit("user-leave", socket.id);

            if (socket.data.userId) {
                const isOwnerLeaving: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomId, socket.data.userId);

                if (isOwnerLeaving) {
                    socket.to(socket.data.roomId).emit("owner-left");
                }
            }
        }
    })
});


const chatNamespace: Namespace = io.of("/chat");

chatNamespace.use(async (socket: Socket, next) => {
    const cookies: Map<string, string> = new Map();

    socket.request.headers.cookie?.split("; ").forEach((string: string) => {
        const [key, value]: string[] = string.split("=");
        cookies.set(key, value);
    });

    const accessToken: string | undefined = cookies.get("__Secure-AccessToken");
    const refreshToken: string | undefined = cookies.get("__Secure-RefreshToken");

    let userId: string | undefined = undefined;

    if (accessToken) {
        try {
            userId = jwt.verifyAccessToken(accessToken)?.id;
        }
        catch {
            userId = undefined;
        }
    }

    if (!userId && refreshToken) {
        let newAccessToken: string | null;

        try {
            newAccessToken = await authService.refreshAccessToken(refreshToken);
        }
        catch {
            newAccessToken = null;
        }

        if (newAccessToken) {
            userId = jwt.verifyAccessToken(newAccessToken)?.id;
        }
    }

    if (!userId) {
        socket.disconnect();
        next(new Error("Unauthorized"));
        return;
    }

    socket.data.userId = userId;

    next();
});

chatNamespace.on("connection", async (socket: Socket) => {
    socket.on("chat-message", (message: { userId: string, content: string }) => {
        socket.to(message.userId).emit("chat-message", { socketId: socket.id, content: message.content });
    });
});