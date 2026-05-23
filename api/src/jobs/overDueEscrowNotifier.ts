import cron from "node-cron"
import { notifyOverdueEscrow, automaticReleaseFund } from "../services/escrow.service"

export const startOverdueNotifier = () => {
  cron.schedule("0 */6 * * *", async () => {
   console.log("[CRON] checking overdue escrows ...");
   await notifyOverdueEscrow();
  })

  cron.schedule("*/30 * * * *", async () => {
   console.log("[CRON] checking escrows for auto release ...");
   await automaticReleaseFund();
  })
}