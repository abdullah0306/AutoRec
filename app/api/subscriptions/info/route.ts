import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * API endpoint to get subscription information for the current user
 * @param req NextRequest object
 * @returns NextResponse with subscription information
 */
export async function GET(req: NextRequest) {
  try {
    // Get user email from authorization header
    const authHeader = req.headers.get('authorization');
    let userEmail: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userEmail = authHeader.substring(7);
    } else {
      // Fallback to session if no auth header
      const session = await getServerSession(authOptions);
      userEmail = session?.user?.email || null;
    }
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    // Get user with subscription and package information
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        subscription: {
          include: {
            package: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!user.subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    // Return subscription information
    return NextResponse.json({
      userId: user.id,
      subscriptionId: user.subscription.id,
      packageId: user.subscription.packageId,
      packageName: user.subscription.package?.name || 'Basic',
      monthlyUsage: user.subscription.monthlyUsage,
      monthlyEmailUsage: user.subscription.monthlyEmailUsage,
      monthlyCandidateUsage: user.subscription.monthlyCandidateUsage,
      maxMonthlyScrapes: user.subscription.package?.maxMonthlyScrapes || 50,
      maxMonthlyEmails: user.subscription.package?.maxMonthlyEmails || 100,
      maxMonthlyCandidates: user.subscription.package?.maxMonthlyCandidates || 50,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      isActive: user.subscription.isActive,
      lastUsageReset: user.subscription.lastUsageReset
    });
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription information' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
