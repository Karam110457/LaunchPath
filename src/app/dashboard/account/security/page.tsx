import { Separator } from "@/components/ui/separator"
import { SecuritySettings } from "@/components/account/SecuritySettings"

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security</h3>
        <p className="text-sm text-muted-foreground">
          Manage your password and security settings.
        </p>
      </div>
      <Separator />
      <SecuritySettings />
    </div>
  )
}
