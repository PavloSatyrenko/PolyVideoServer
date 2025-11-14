import { Request, Response } from "express";
import { User } from "@prisma/client";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "config/env";
import ms from "ms";
import { authService } from "services/auth.service";

export const authController = {
    async signUp(request: Request, response: Response): Promise<void> {
        try {
            const email: string = request.body.email;
            const name: string = request.body.name;
            const surname: string = request.body.surname;
            const password: string = request.body.password;

            const result: { accessToken: string, refreshToken: string } | null = await authService.signUpUser(email, name, surname, password);

            if (result) {
                response.cookie("__Secure-AccessToken", result.accessToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: ms(ACCESS_TOKEN_EXPIRES_IN)
                });

                response.cookie("__Secure-RefreshToken", result.refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: ms(REFRESH_TOKEN_EXPIRES_IN)
                });

                response.status(201).json({ message: "Signed up successfully" });
            }
            else {
                response.status(400).json({ message: "User account with that phone number already exists" });
            }
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async login(request: Request, response: Response): Promise<void> {
        try {
            const email: string = request.body.email;
            const password: string = request.body.password;

            const result: { accessToken: string, refreshToken: string } | null = await authService.loginUser(email, password);

            if (result) {
                response.cookie("__Secure-AccessToken", result.accessToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: ms(ACCESS_TOKEN_EXPIRES_IN)
                });

                response.cookie("__Secure-RefreshToken", result.refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: ms(REFRESH_TOKEN_EXPIRES_IN)
                });

                response.status(200).json({ message: "Logged in successfully" });
            }
            else {
                response.status(400).json({ message: "Invalid credentials" });
            }
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async getAuthorizedUser(request: Request, response: Response): Promise<void> {
        try {
            const userId: string = request.user!.id;

            const user: Omit<User, "passwordHash"> | null = await authService.getAuthorizedUser(userId);

            if (user) {
                response.status(200).json({ user });
            }
            else {
                response.status(404).json({ message: "User not found" });
            }
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async logout(request: Request, response: Response): Promise<void> {
        try {
            response.clearCookie("__Secure-AccessToken", {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            });
            response.clearCookie("__Secure-RefreshToken", {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            });
            response.status(200).json({ message: "Logged out successfully" });
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    async refreshToken(request: Request, response: Response): Promise<void> {
        try {
            const refreshToken: string = request.cookies["__Secure-RefreshToken"];

            const accessToken: string | null = await authService.refreshAccessToken(refreshToken);

            if (accessToken) {
                response.cookie("__Secure-AccessToken", accessToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: ms(ACCESS_TOKEN_EXPIRES_IN)
                });

                response.status(200).json({ message: "Access token has been successfully refreshed" });
            }
            else {
                response.status(403).json({ message: "Invalid or expired token" });
            }
        }
        catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    }
}