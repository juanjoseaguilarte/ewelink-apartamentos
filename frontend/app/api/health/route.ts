import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", buildTs: process.env.NEXT_PUBLIC_BUILD_TS ?? "0" });
}
