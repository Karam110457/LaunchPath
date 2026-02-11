import { Separator } from "@/components/ui/separator"
import { AccountSidebarNav } from "@/components/account/AccountSidebarNav"

const sidebarNavItems = [
  {
    title: "General",
    href: "/dashboard/account",
  },
  {
    title: "Billing",
    href: "/dashboard/account/billing",
  },
  {
    title: "Notifications",
    href: "/dashboard/account/notifications",
  },
  {
    title: "Security",
    href: "/dashboard/account/security",
  },
]

interface AccountLayoutProps {
  children: React.ReactNode
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="space-y-6 p-4 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Account</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5 overflow-x-auto px-4 lg:px-0">
          <AccountSidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  )
}
