import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { transactionService } from "../services/transaction.service";

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await transactionService.findAll(req.query as any);
  res.json({ success: true, ...result });
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.findById(req.params.id);
  res.json({ success: true, data: transaction });
});

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.create(req.userId!, req.body);
  res.status(201).json({ success: true, message: "Transacción creada", data: transaction });
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await transactionService.addPayment(req.body);
  res.status(201).json({ success: true, message: "Pago registrado", data: payment });
});

export const updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const payment = await transactionService.updatePayment(req.params.id, req.body);
  res.json({ success: true, message: "Estado del pago actualizado", data: payment });
});
