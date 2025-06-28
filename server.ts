import { config as dotenvConfig } from "dotenv";
import express, { Express, Response } from "express";
import { Server } from "http";
import { Server as ioServer, Socket } from "socket.io";

dotenvConfig();

const expressApp: Express = express();
const server: Server = expressApp.use((_, response: Response) => { response.send("Server is working") })
    .listen(process.env.PORT || 3000, () => console.log("Listening on port " + process.env.PORT || 3000));

const io: ioServer = new ioServer(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("join", (roomId: string) => {
        socket.join(roomId);
        socket.data.roomId = roomId;
        console.log(`Client ${socket.id} joined room ${roomId}`);

        socket.to(roomId).emit("new-user", socket.id);
    });

    socket.on("offer", (data: { socketId: string, offer: RTCSessionDescriptionInit }) => {
        io.to(data.socketId).emit("offer", { socketId: socket.id, offer: data.offer });
    })

    socket.on("answer", (data: { socketId: string, answer: RTCSessionDescriptionInit }) => {
        io.to(data.socketId).emit("answer", { socketId: socket.id, answer: data.answer });
    });

    socket.on("iceCandidate", (data: { socketId: string, candidate: RTCIceCandidate }) => {
        io.to(data.socketId).emit("iceCandidate", { socketId: socket.id, candidate: data.candidate });
    });

    socket.on("leave", (roomId: string) => {
        socket.to(roomId).emit("user-leave", socket.id);

        socket.leave(roomId);
        console.log(`Client ${socket.id} leaved room ${roomId}`)
    });

    socket.on("disconnect", () => {
        if (socket.data.roomId) {
            socket.to(socket.data.roomId).emit("user-leave", socket.id);
        }

        console.log(`Client ${socket.id} disconneted`);
    })
});
