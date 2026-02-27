import { requireAuth } from "@/lib/auth/guards";
import { StartConfirmation } from "./StartConfirmation";

export default async function StartPage() {
  await requireAuth();
  return <StartConfirmation />;
}
