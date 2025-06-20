import { z } from "zod";

import { ReportReason, ReportTargetType } from "../generated/prisma/index.js";

export const reportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType, {
    required_error: "Target type is required.",
  }),
  targetId: z
    .string({
      required_error: "Target ID is required.",
    })
    .trim()
    .nonempty({ message: "Target ID can not be empty." })
    .uuid(),
  reason: z.nativeEnum(ReportReason, { required_error: "Reason is required." }),
});

export type ReportType = z.infer<typeof reportSchema>;
