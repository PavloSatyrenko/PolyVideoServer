import { Request, Response } from "express";
import { loginUser, refreshAccessToken, signUpUser } from "services/auth.service";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "config/env";
import ms from "ms";

export async function signUp(request: Request, response: Response): Promise<void> {
    const email: string | null = request.body.email;
    const password: string | null = request.body.password;

    if (!email || !password) {
        response.status(400).json({ message: "Missing email or password" });
        return;
    }

    const result: { accessToken: string, refreshToken: string } | null = await signUpUser(email, password);

    if (result) {
        response.cookie("__Secure-AccessToken", result.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: ms(ACCESS_TOKEN_EXPIRES_IN)
        });

        response.cookie("__Secure-RefreshToken", result.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: ms(REFRESH_TOKEN_EXPIRES_IN)
        });

        response.status(201).json({ message: "Signed up successfully" });
    }
    else {
        response.status(400).json({ message: "User account with that email already exists" });
    }
}

export async function login(request: Request, response: Response): Promise<void> {
    const email: string = request.body.email;
    const password: string = request.body.password;

    if (!email || !password) {
        response.status(400).json({ message: "Missing email or password" });
        return;
    }

    const result: { accessToken: string, refreshToken: string } | null = await loginUser(email, password);

    if (result) {
        response.cookie("__Secure-AccessToken", result.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: ms(ACCESS_TOKEN_EXPIRES_IN)
        });

        response.cookie("__Secure-RefreshToken", result.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: ms(REFRESH_TOKEN_EXPIRES_IN)
        });

        response.status(200).json({ message: "Loged in successfully" });
    }
    else {
        response.status(401).json({ message: "Invalid credentials" });
    }
}

export async function refreshToken(request: Request, response: Response): Promise<void> {
    const refreshToken: string | null = request.cookies["__Secure-RefreshToken"];

    if (!refreshToken) {
        response.status(401).json({ message: "Missing refresh token" });
        return;
    }

    const accessToken: string | null = await refreshAccessToken(refreshToken);

    if (accessToken) {
        response.cookie("__Secure-AccessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: ms(ACCESS_TOKEN_EXPIRES_IN)
        });

        response.status(200).json({ message: "Access token has been successfully refreshed" });
    }
    else {
        response.status(403).json({ message: "Invalid or expired token" });
    }
}
