import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { PORT } from "./config/env";
import { Server } from "http";
import { Server as ioServer, Namespace, Socket } from "socket.io";

const server: Server = app.listen(PORT, () => {
    console.log("Server listening on port " + PORT);
});

const io: ioServer = new ioServer(server, {
    cors: { origin: "*" }
});

const meetingNamespace: Namespace = io.of("/meeting");

meetingNamespace.on("connection", (socket: Socket) => {
    console.log("Socket connected: " + socket.id);

    socket.on("join", (roomId: string) => {
        socket.join(roomId);
        socket.data.roomId = roomId;

        socket.to(roomId).emit("new-user", socket.id);
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
