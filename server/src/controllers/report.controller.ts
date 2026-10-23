import type { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service.js';
import { sendSuccess } from '../utils/response.js';
<<<<<<< HEAD

export async function createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
=======
import { AppError } from '../utils/errors.js';

export async function createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw AppError.unauthenticated();
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    const report = await reportService.createReport(req.user.id, req.body);
    sendSuccess(
      res,
      {
        reportId: report._id.toString(),
        category: report.category,
        status: report.moderationStatus,
        submittedAt: report.submittedAt.toISOString(),
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bbox = req.query.bbox as string;
    const reports = await reportService.getReportsInBbox(bbox);
    sendSuccess(res, reports, 200);
  } catch (err) {
    next(err);
  }
}

export async function confirmReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
<<<<<<< HEAD
=======
    if (!req.user) throw AppError.unauthenticated();
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    const reportId = req.params.reportId as string;
    const result = await reportService.confirmReport(reportId);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function retractReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
<<<<<<< HEAD
=======
    if (!req.user) throw AppError.unauthenticated();
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    const reportId = req.params.reportId as string;
    const result = await reportService.retractReport(req.user.id, reportId);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}
