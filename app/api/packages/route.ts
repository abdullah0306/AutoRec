import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[GET_PACKAGES_ERROR] Details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return NextResponse.json(
        { 
          error: "Database query failed",
          details: {
            code: error.code,
            message: error.message
          }
        },
        { status: 500 }
      );
    }
    // Handle other types of errors
    console.error('[GET_PACKAGES_ERROR] Unknown error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
