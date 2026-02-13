import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const facilities = await prisma.facility.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(facilities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
