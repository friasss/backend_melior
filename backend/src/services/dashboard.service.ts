import { prisma } from "../config/database";

export class DashboardService {
  async getAdminDashboard() {
    const [
      totalProperties,
      propertiesForSale,
      propertiesForRent,
      totalClients,
      totalAgents,
      totalInquiries,
      pendingAppointments,
      recentProperties,
      recentInquiries,
      propertyTypeDistribution,
      monthlyTransactions,
      topAgents,
    ] = await prisma.$transaction([
      prisma.property.count({ where: { listingStatus: "ACTIVE" } }),
      prisma.property.count({ where: { listingStatus: "ACTIVE", status: "SALE" } }),
      prisma.property.count({ where: { listingStatus: "ACTIVE", status: "RENT" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { role: "AGENT" } }),
      prisma.contactInquiry.count({ where: { status: "NEW" } }),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.property.findMany({
        where: { listingStatus: "ACTIVE" },
        select: {
          id: true, title: true, price: true, status: true, propertyType: true, createdAt: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.contactInquiry.findMany({
        where: { status: "NEW" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.property.groupBy({
        by: ["propertyType"],
        where: { listingStatus: "ACTIVE" },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.agentProfile.findMany({
        orderBy: { totalSales: "desc" },
        take: 5,
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalProperties,
        propertiesForSale,
        propertiesForRent,
        totalClients,
        totalAgents,
        totalInquiries,
        pendingAppointments,
      },
      recentProperties,
      recentInquiries,
      charts: {
        propertyTypeDistribution: propertyTypeDistribution.map((t) => ({
          type: t.propertyType,
          count: t._count,
        })),
        monthlyTransactions: monthlyTransactions.map((t) => ({
          type: t.type,
          totalAmount: t._sum.amount || 0,
          count: t._count,
        })),
      },
      topAgents: topAgents.map((a) => ({
        id: a.id,
        name: `${a.user.firstName} ${a.user.lastName}`,
        avatar: a.user.avatarUrl,
        totalSales: a.totalSales,
        rating: a.rating,
      })),
    };
  }

  async getAgentDashboard(agentUserId: string) {
    const agent = await prisma.agentProfile.findUnique({ where: { userId: agentUserId } });
    if (!agent) return null;

    const [
      myProperties,
      myActiveProperties,
      myAppointments,
      myTransactions,
      recentProperties,
    ] = await prisma.$transaction([
      prisma.property.count({ where: { agentId: agent.id } }),
      prisma.property.count({ where: { agentId: agent.id, listingStatus: "ACTIVE" } }),
      prisma.appointment.count({ where: { agentId: agent.id, status: "PENDING" } }),
      prisma.transaction.count({ where: { agentId: agent.id } }),
      prisma.property.findMany({
        where: { agentId: agent.id },
        select: {
          id: true, title: true, price: true, status: true, listingStatus: true, viewCount: true,
          _count: { select: { favorites: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      stats: {
        totalProperties: myProperties,
        activeProperties: myActiveProperties,
        pendingAppointments: myAppointments,
        totalTransactions: myTransactions,
        rating: agent.rating,
        totalSales: agent.totalSales,
      },
      recentProperties,
    };
  }
}

export const dashboardService = new DashboardService();
