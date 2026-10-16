// Single mock/real switch. With NEXT_PUBLIC_USE_MOCKS=false every call goes
// through fetch() to /api/* (proxied by a Next.js rewrite to the FastAPI
// backend). See README.md for run steps.
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
