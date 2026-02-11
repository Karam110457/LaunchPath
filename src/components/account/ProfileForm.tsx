"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select } from "@/components/ui/select"

export function ProfileForm() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-x-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">JD</AvatarFallback>
        </Avatar>
        <div>
          <Button variant="outline" size="sm" className="mr-2">
            Change avatar
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            Remove
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, GIF or PNG. 1MB max.
          </p>
        </div>
      </div>

      <Separator />

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="John" defaultValue="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Doe" defaultValue="Doe" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" defaultValue="john@example.com" disabled />
          <p className="text-[0.8rem] text-muted-foreground">
            This is the email address you use to log in. Contact support to change it.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select id="role" defaultValue="founder" disabled>
            <option value="founder">Founder / Solo Builder</option>
            <option value="developer">Developer</option>
            <option value="marketer">Marketer</option>
          </Select>
          <p className="text-[0.8rem] text-muted-foreground">
            Your role determines your initial LaunchPath configuration.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell us a little bit about yourself"
            defaultValue="Building the next big thing in AI."
          />
          <p className="text-[0.8rem] text-muted-foreground">
            Brief description for your public profile (coming soon).
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Update profile</Button>
        </div>
      </form>
    </div>
  )
}
