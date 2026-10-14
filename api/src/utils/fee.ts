import { config } from "../config";

export const appFeePercent = config.appFeePercent;

export const appFeeCents = (amountCents: number): number => {
  if (amountCents <= 0) return 0;
  return Math.floor((amountCents * appFeePercent) / 100);
};
