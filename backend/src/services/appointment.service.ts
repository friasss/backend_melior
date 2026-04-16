import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { CreateAppointmentInput, UpdateAppointmentInput } from "../schemas/appointment.schema";
import { notificationService } from "./notification.service";

export class AppointmentService {
  async findByAgent(agentUserId: string) {
    const agent = await prisma.agentProfile.findUnique({ where: { userId: agentUserId } });
    if (!agent) throw ApiError.notFound("Perfil de agente no encontrado");

    return prisma.appointment.findMany({
      where: { agentId: agent.id },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        client: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async findByClient(clientUserId: string) {
    const client = await prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!client) throw ApiError.notFound("Perfil de cliente no encontrado");

    return prisma.appointment.findMany({
      where: { clientId: client.id },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        agent: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async create(agentUserId: string, input: CreateAppointmentInput) {
    const agent = await prisma.agentProfile.findUnique({ where: { userId: agentUserId } });
    if (!agent) throw ApiError.forbidden("Solo los agentes pueden crear citas");

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id: input.clientId },
      include: { user: true },
    });
    if (!clientProfile) throw ApiError.notFound("Cliente no encontrado");

    const appointment = await prisma.appointment.create({
      data: {
        propertyId: input.propertyId,
        clientId: input.clientId,
        agentId: agent.id,
        scheduledAt: input.scheduledAt,
        endAt: input.endAt,
        notes: input.notes,
      },
      include: {
        property: { select: { id: true, title: true } },
      },
    });

    // Notify the client
    await notificationService.create({
      userId: clientProfile.userId,
      type: "APPOINTMENT",
      title: "Nueva cita programada",
      body: `Se ha programado una visita para ${appointment.property.title}`,
      data: { appointmentId: appointment.id, propertyId: appointment.propertyId },
    });

    return appointment;
  }

  async update(appointmentId: string, userId: string, userRole: string, input: UpdateAppointmentInput) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { agent: true, client: true },
    });

    if (!appointment) throw ApiError.notFound("Cita no encontrada");

    if (userRole !== "ADMIN" && appointment.agent.userId !== userId) {
      throw ApiError.forbidden("No tienes permiso para modificar esta cita");
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: input,
    });

    // Notify the client about the change
    if (input.status) {
      await notificationService.create({
        userId: appointment.client.userId,
        type: "APPOINTMENT",
        title: `Cita ${input.status === "CONFIRMED" ? "confirmada" : input.status === "CANCELLED" ? "cancelada" : "actualizada"}`,
        body: `Tu cita ha sido ${input.status.toLowerCase()}`,
        data: { appointmentId },
      });
    }

    return updated;
  }

  async delete(appointmentId: string, userId: string, userRole: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { agent: true },
    });

    if (!appointment) throw ApiError.notFound("Cita no encontrada");
    if (userRole !== "ADMIN" && appointment.agent.userId !== userId) {
      throw ApiError.forbidden("No tienes permiso");
    }

    await prisma.appointment.delete({ where: { id: appointmentId } });
  }
}

export const appointmentService = new AppointmentService();
