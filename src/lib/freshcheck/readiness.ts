import { queryOptions } from "@tanstack/react-query";
import { verificationReadiness } from "./verification.functions";

export const readinessOptions = queryOptions({
  queryKey: ["verification-readiness"],
  queryFn: () => verificationReadiness(),
  staleTime: 15000,
});