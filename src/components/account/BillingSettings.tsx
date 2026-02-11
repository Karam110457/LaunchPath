"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function BillingSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Current Plan */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl text-primary">Pro Plan</CardTitle>
              <CardDescription>
                You are currently on the Pro plan.
              </CardDescription>
            </div>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">Subscription Cost</p>
              <p className="text-2xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">Next Billing Date</p>
              <p className="text-base text-muted-foreground">March 12, 2026</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-primary/10 bg-primary/5 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Manage your subscription on Stripe.
          </p>
          <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">Manage Subscription</Button>
        </CardFooter>
      </Card>

      {/* Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Offers</CardTitle>
            <CardDescription>
              Number of active offer theses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 / 3</div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary">
              <div className="h-full w-1/3 rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Generations</CardTitle>
            <CardDescription>
              Monthly generation credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">450 / 1000</div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary">
              <div className="h-full w-[45%] rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Payment Method */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Method</h3>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-14 items-center justify-center rounded border bg-background">
                <span className="font-serif font-bold italic">VISA</span>
              </div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 04/2028</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing History</h3>
        <div className="rounded-md border">
          <div className="grid grid-cols-4 border-b bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div className="text-right">Invoice</div>
          </div>
          {[
            { date: "Feb 12, 2026", amount: "$29.00", status: "Paid" },
            { date: "Jan 12, 2026", amount: "$29.00", status: "Paid" },
            { date: "Dec 12, 2025", amount: "$29.00", status: "Paid" },
          ].map((invoice, i) => (
            <div key={i} className="grid grid-cols-4 items-center p-4 text-sm hover:bg-muted/50 transition-colors">
              <div>{invoice.date}</div>
              <div>{invoice.amount}</div>
              <div>
                <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10 hover:bg-green-500/20 hover:text-green-500">{invoice.status}</Badge>
              </div>
              <div className="text-right">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Download</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.5V6.3636L9.18186 5.13179C9.3576 4.95605 9.64252 4.95605 9.81826 5.13179C9.994 5.30753 9.994 5.59245 9.81826 5.76819L7.81826 7.76819C7.73387 7.85258 7.61941 7.90005 7.50005 7.90005C7.38069 7.90005 7.26623 7.85258 7.18185 7.76819L5.18185 5.76819C5.00611 5.59245 5.00611 5.30753 5.18185 5.13179C5.35759 4.95605 5.64251 4.95605 5.81825 5.13179L7.05005 6.3636V1.5C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5523 3.44772 13 4 13H11C11.5523 13 12 12.5523 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1046 12.1046 14 11 14H4C2.89543 14 2 13.1046 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
