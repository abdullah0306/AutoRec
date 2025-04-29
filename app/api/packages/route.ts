import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('Querying packages...');
    const packages = await prisma.package.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        maxMonthlyScrapes: true,
        maxUrlsPerBatch: true,
        maxPagesPerSite: true,
        concurrentSites: true,
        maxMonthlyEmails: true,
        maxEmailsPerSite: true,
        isActive: true
      }
    });

    console.log('Found packages:', packages);
    return NextResponse.json(packages);
  } catch (error) {
    console.error("[GET_PACKAGES_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
