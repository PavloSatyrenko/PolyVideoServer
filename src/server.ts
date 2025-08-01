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

const conferenceNamespace: Namespace = io.of("/conference");

conferenceNamespace.on("connection", (socket: Socket) => {
    socket.on("join", (roomId: string) => {
        socket.join(roomId);
        socket.data.roomId = roomId;

        socket.to(roomId).emit("new-user", socket.id);
    });

    socket.on("offer", (data: { socketId: string, offer: RTCSessionDescriptionInit }) => {
        conferenceNamespace.to(data.socketId).emit("offer", { socketId: socket.id, offer: data.offer });
    })

    socket.on("answer", (data: { socketId: string, answer: RTCSessionDescriptionInit }) => {
        conferenceNamespace.to(data.socketId).emit("answer", { socketId: socket.id, answer: data.answer });
    });

    socket.on("iceCandidate", (data: { socketId: string, candidate: RTCIceCandidate }) => {
        conferenceNamespace.to(data.socketId).emit("iceCandidate", { socketId: socket.id, candidate: data.candidate });
    });

    socket.on("leave", (roomId: string) => {
        socket.to(roomId).emit("user-leave", socket.id);

        socket.leave(roomId);
    });

    socket.on("disconnect", () => {
        if (socket.data.roomId) {
            socket.to(socket.data.roomId).emit("user-leave", socket.id);
        }
    })
});
