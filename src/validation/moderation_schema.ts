import { z } from "zod";

import { ReportReason } from "../constants/enums.js";

export const reportSchema = z.object({
  reason: z.nativeEnum(ReportReason, { required_error: "Reason is required." }),
});

export type ReportType = z.infer<typeof reportSchema>;
