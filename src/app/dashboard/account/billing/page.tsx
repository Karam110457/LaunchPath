import { Separator } from "@/components/ui/separator"
import { BillingSettings } from "@/components/account/BillingSettings"

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing & Plans</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, billing details, and invoices.
        </p>
      </div>
      <Separator />
      <BillingSettings />
    </div>
  )
}
