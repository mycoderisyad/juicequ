import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware.
 * Checks authentication and role-based access.
 */

// Routes that require authentication
const PROTECTED_ROUTES = ["/cart", "/orders", "/profile"];

// Routes that require cashier role
const CASHIER_ROUTES = ["/cashier"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

/**
 * Get user from cookie/token.
 */
function getUserFromRequest(request: NextRequest): { role: string } | null {
  // Check for token in cookie or header
  const token = request.cookies.get("token")?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    // Decode JWT to get user info (basic decode, not verification)
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(atob(base64Payload));
    return { role: payload.role || "pembeli" };
  } catch {
    return null;
  }
}

/**
 * Check if user has required role.
 */
function hasAccess(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === "admin") return true;
  
  // Kasir has access to cashier routes
  if (userRole === "kasir" && requiredRoles.includes("kasir")) return true;
  
  // Pembeli has access to customer routes
  if (requiredRoles.includes("pembeli")) return true;
  
  return requiredRoles.includes(userRole);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  
  const user = getUserFromRequest(request);
  
  // Check admin routes
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!user || user.role !== "admin") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }
  
  // Check cashier routes
  if (CASHIER_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!user || !hasAccess(user.role, ["kasir", "admin"])) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }
  
  // Check protected routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
    }
  }
  
  // Redirect authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && user) {
    // Redirect based on role
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (user.role === "kasir") {
      return NextResponse.redirect(new URL("/cashier", request.url));
    }
    return NextResponse.redirect(new URL("/menu", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
