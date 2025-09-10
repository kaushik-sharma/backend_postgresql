import { z } from "zod";

import { ReportReason, ReportTargetType } from "../generated/prisma/index.js";

export const reportSchema = z.object({
  targetType: z.enum(ReportTargetType, {
    error: "Target type is required.",
  }),
  targetId: z
    .uuid({ error: "Target ID is required." })
    .trim()
    .nonempty({ message: "Target ID can not be empty." }),
  reason: z.enum(ReportReason, { error: "Reason is required." }),
});

export type ReportType = z.infer<typeof reportSchema>;
