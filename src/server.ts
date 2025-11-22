import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { PORT } from "./config/env";
import { Server } from "http";
import { Server as ioServer, Namespace, Socket } from "socket.io";
import { jwt } from "utils/jwt";
import { authService } from "services/auth.service";
import { ChatMessage, User } from "@prisma/client";
import { meetingsService } from "services/meetings.service";
import { chatsService } from "services/chats.service";

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
        socket.leave(data.roomCode + "-waiting");

        socket.join(data.roomCode);

        socket.data.roomCode = data.roomCode;
        socket.data.isHandUp = false;

        if (!socket.data.name) {
            socket.data.name = data.name;
        }

        meetingNamespace.to(data.roomCode).emit("new-user", { socketId: socket.id, name: socket.data.name, userId: socket.data.userId });

        if (socket.data.userId) {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(data.roomCode, socket.data.userId);

            if (isOwner) {
                meetingNamespace.to(data.roomCode + "-waiting").emit("owner-joined");

                const waitingSockets: Set<string> | undefined = meetingNamespace.adapter.rooms.get(data.roomCode + "-waiting");

                if (waitingSockets) {
                    waitingSockets.forEach((waitingSocketId: string) => {
                        socket.emit("join-request", { socketId: waitingSocketId, name: meetingNamespace.sockets.get(waitingSocketId)!.data.name });
                    });
                }
            }
        }

        socket.emit("all-users", Array.from(meetingNamespace.adapter.rooms.get(data.roomCode) ?? [])
            .filter((socketId: string) => socketId !== socket.id)
            .map((socketId: string) => ({
                socketId: socketId,
                name: meetingNamespace.sockets.get(socketId)!.data.name,
                userId: meetingNamespace.sockets.get(socketId)!.data.userId,
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

        if (!socket.data.name) {
            socket.data.name = data.name;
        }

        socket.join(data.roomCode + "-waiting");

        socket.data.roomCode = data.roomCode + "-waiting";
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

    socket.on("meeting-info-updated", async (data: { title: string, isWaitingRoom: boolean, isScreenSharing: boolean, isGuestAllowed: boolean }) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId || "");

            if (!isOwner) {
                return;
            }
        }
        catch {
            return;
        }

        meetingNamespace.to(socket.data.roomCode).emit("meeting-info-updated", data);
    });

    socket.on("mute", () => {
        meetingNamespace.to(socket.data.roomCode).emit("mute", socket.id);
    });

    socket.on("unmute", () => {
        meetingNamespace.to(socket.data.roomCode).emit("unmute", socket.id);
    });

    socket.on("disable-video", () => {
        meetingNamespace.to(socket.data.roomCode).emit("disable-video", socket.id);
    });

    socket.on("enable-video", () => {
        meetingNamespace.to(socket.data.roomCode).emit("enable-video", socket.id);
    });

    socket.on("start-screen-share", () => {
        meetingNamespace.to(socket.data.roomCode).emit("start-screen-share", socket.id);
    });

    socket.on("stop-screen-share", () => {
        meetingNamespace.to(socket.data.roomCode).emit("stop-screen-share", socket.id);
    });

    socket.on("hand-up", () => {
        socket.data.isHandUp = true;
        meetingNamespace.to(socket.data.roomCode).emit("hand-up", socket.id);
    });

    socket.on("hand-down", () => {
        socket.data.isHandUp = false;
        meetingNamespace.to(socket.data.roomCode).emit("hand-down", socket.id);
    });

    socket.on("mute-user", async (socketId: string) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId || "");

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
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId || "");

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
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId || "");

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
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId || "");

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
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId || "");

            if (!isOwner) {
                return;
            }
        }
        catch {
            return;
        }

        meetingNamespace.to(socketId).emit("removed-from-meeting");
    });

    socket.on("transfer-ownership", async (participantId: string) => {
        try {
            const isOwner: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId || "");

            if (!isOwner) {
                return;
            }
        }
        catch {
            return;
        }

        const status: number = await meetingsService.transferMeetingOwnership(socket.data.roomCode, socket.data.userId || "", participantId);

        if (status === 200) {
            meetingNamespace.to(socket.data.roomCode).emit("ownership-transferred", participantId);
            socket.emit("ownership-transferred", participantId);
        }
    });

    socket.on("chat-message", (message: { id: string, senderName: string, content: string }) => {
        meetingNamespace.to(socket.data.roomCode).emit("chat-message", message);
    });

    socket.on("leave", (roomCode: string) => {
        meetingNamespace.to(roomCode).emit("user-leave", socket.id);
        socket.leave(roomCode);
    });

    socket.on("disconnect", async () => {
        if (socket.data.roomCode) {
            meetingNamespace.to(socket.data.roomCode).emit("user-leave", socket.id);

            if (socket.data.userId) {
                const isOwnerLeaving: boolean = await meetingsService.isUserMeetingOwner(socket.data.roomCode, socket.data.userId);

                if (isOwnerLeaving) {
                    meetingNamespace.to(socket.data.roomCode + "-waiting").emit("owner-left");
                }
            }
        }

        if (socket.data.roomCode?.endsWith("-waiting")) {
            const ownerId: string = (await meetingsService.getMeetingByCode(socket.data.roomCode.slice(0, -8)))?.ownerId || "";

            const ownerSocketId: string = Array.from(meetingNamespace.adapter.rooms.get(socket.data.roomCode.slice(0, -8)) ?? [])
                .find((socketId: string) => {
                    const userId: string | undefined = meetingNamespace.sockets.get(socketId)!.data.userId;

                    if (!userId) {
                        return false;
                    }

                    return userId === ownerId;
                }) || "";

            if (ownerSocketId) {
                meetingNamespace.to(ownerSocketId).emit("request-cancelled", socket.id);
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
    socket.on("chat-message", async (message: { userId: string, content: string }) => {
        const newMessage: ChatMessage = await chatsService.sendMessage(socket.data.userId, message.userId, message.content);

        const userSocketId: string = Array.from(chatNamespace.sockets)
            .find(([_, socket]: [string, Socket]) => socket.data.userId === message.userId)?.[0] || "";

        if (userSocketId) {
            chatNamespace.to(userSocketId).emit("chat-message", { message: newMessage, userId: socket.data.userId });
        }

        socket.emit("message-sent", { message: newMessage, userId: message.userId });
    });
});