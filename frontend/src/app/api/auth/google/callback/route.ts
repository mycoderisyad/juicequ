import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get("error_description") || "Authentication failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=No+authorization+code+received", request.url)
    );
  }

  try {
    // Exchange code for tokens via backend
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
    
    const response = await fetch(
      `${API_URL}/api/v1/auth/google/callback?redirect_uri=${encodeURIComponent(redirectUri)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || "Authentication failed";
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    const data = await response.json();
    const { access_token, refresh_token } = data;

    // Create redirect response
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));

    // Set tokens in cookies
    redirectResponse.cookies.set("token", access_token, {
      httpOnly: false, // Needs to be readable by JS for auth store
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Also set access_token for compatibility
    redirectResponse.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30, // 30 minutes
      path: "/",
    });

    if (refresh_token) {
      redirectResponse.cookies.set("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/api/auth",
      });
    }

    // Set a flag to trigger auth store update on client
    redirectResponse.cookies.set("auth_callback", "google", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1 minute - just for detection
      path: "/",
    });

    return redirectResponse;
  } catch (err) {
    return NextResponse.redirect(
      new URL("/login?error=Authentication+failed", request.url)
    );
  }
}

