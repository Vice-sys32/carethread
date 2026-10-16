import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hc_session";

function readRole(request: NextRequest): "patient" | "doctor" | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { role?: string };
    return parsed.role === "patient" || parsed.role === "doctor" ? parsed.role : null;
  } catch {
    // Opaque session cookie from the real backend; role is resolved client side.
    return null;
  }
}

export function proxy(request: NextRequest) {
  // Next.js issues internal RSC/prefetch/static-generation requests without
  // browser cookies. Redirecting those breaks route rendering (and dev-mode
  // static path generation), so only guard document navigations. Protected
  // data lives behind /api/* and the client-side role guard, not in pages.
  const isInternalRequest =
    request.headers.get("rsc") === "1" ||
    !!request.headers.get("next-router-prefetch") ||
    !!request.headers.get("next-router-state-tree") ||
    !!request.headers.get("next-router-segment-prefetch");
  if (isInternalRequest) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const role = readRole(request);
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const home = role === "doctor" ? "/doctor/find" : "/patient/timeline";

  if (role && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  const isPatientArea = pathname.startsWith("/patient");
  const isDoctorArea = pathname.startsWith("/doctor");

  if ((isPatientArea || isDoctorArea) && !hasSession) {
    const next = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
  }

  if (role && (isPatientArea || isDoctorArea)) {
    if (isPatientArea && role === "doctor") {
      return NextResponse.redirect(new URL("/doctor/find", request.url));
    }
    if (isDoctorArea && role === "patient") {
      return NextResponse.redirect(new URL("/patient/timeline", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/patient/:path*", "/doctor/:path*"],
};
