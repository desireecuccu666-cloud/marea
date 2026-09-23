import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, existsSync, rmSync } from "node:fs";

const pexec = promisify(execFile);
export const dynamic = "force-dynamic";

/** One-click download of the whole project (no secrets, no build artifacts). */
export async function GET() {
  try {
    const root = process.cwd();
    const out = "/tmp/marea-progetto.zip";
    rmSync(out, { force: true });
    await pexec(
      "zip",
      [
        "-qr",
        out,
        ".",
        "-x",
        "node_modules/*",
        ".next/*",
        ".git/*",
        "out/*",
        "build/*",
        ".env",
        ".env.*",
        "*.tsbuildinfo",
      ],
      { cwd: root, maxBuffer: 64 * 1024 * 1024 }
    );
    const buf = readFileSync(out);
    rmSync(out, { force: true });
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="marea-progetto.zip"',
        "Content-Length": String(buf.length),
      },
    });
  } catch (e) {
    // fallback: tar.gz (apribile nativamente su Windows 10+ e Mac)
    try {
      const out = "/tmp/marea-progetto.tar.gz";
      rmSync(out, { force: true });
      await pexec(
        "tar",
        [
          "-czf",
          out,
          "--exclude=node_modules",
          "--exclude=.next",
          "--exclude=.git",
          "--exclude=.env",
          ".",
        ],
        { cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 }
      );
      const buf = readFileSync(out);
      rmSync(out, { force: true });
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": 'attachment; filename="marea-progetto.tar.gz"',
          "Content-Length": String(buf.length),
        },
      });
    } catch {
      return NextResponse.json({ error: "download non disponibile" }, { status: 500 });
    }
  }
}
