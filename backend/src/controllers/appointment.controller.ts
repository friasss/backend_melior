import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { appointmentService } from "../services/appointment.service";

export const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const data =
    req.userRole === "AGENT"
      ? await appointmentService.findByAgent(req.userId!)
      : await appointmentService.findByClient(req.userId!);
  res.json({ success: true, data });
});

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentService.create(req.userId!, req.body);
  res.status(201).json({ success: true, message: "Cita creada", data: appointment });
});

export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentService.update(
    req.params.id, req.userId!, req.userRole!, req.body
  );
  res.json({ success: true, message: "Cita actualizada", data: appointment });
});

export const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  await appointmentService.delete(req.params.id, req.userId!, req.userRole!);
  res.json({ success: true, message: "Cita eliminada" });
});
