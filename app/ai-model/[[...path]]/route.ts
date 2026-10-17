import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await context.params;

  const filePathSegments =
    !segments || segments.length === 0 ? ["index.html"] : segments;
  const targetPath = path.join(process.cwd(), "ai model", ...filePathSegments);

  // Security check: ensure path is within 'ai model'
  const aiModelDir = path.resolve(process.cwd(), "ai model");
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(aiModelDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(/*turbopackIgnore: true*/ resolvedTarget)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let finalTarget = resolvedTarget;
  const stat = fs.statSync(/*turbopackIgnore: true*/ resolvedTarget);
  if (stat.isDirectory()) {
    finalTarget = path.join(resolvedTarget, "index.html");
    if (!fs.existsSync(/*turbopackIgnore: true*/ finalTarget)) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  const ext = path.extname(finalTarget).toLowerCase();

  // If serving an HTML file, inject <base href="/ai-model/"> so all relative assets (css, js, images) resolve accurately
  if (ext === ".html") {
    let htmlContent = fs.readFileSync(/*turbopackIgnore: true*/ finalTarget, "utf-8");
    if (!htmlContent.includes("<base ")) {
      htmlContent = htmlContent.replace(/<head>/i, '<head>\n  <base href="/ai-model/">');
    }
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(/*turbopackIgnore: true*/ finalTarget);

  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    },
  });
}
