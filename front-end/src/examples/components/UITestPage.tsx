import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable } from "@/components/common/DataTable"
import { PageContainer } from "@/components/common/PageContainer"
import { PasswordInput } from "@/components/common/PasswordInput"
import { SearchInput } from "@/components/common/SearchInput"
import { ThemeSwitch } from "@/components/theme-switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ColumnDef } from "@tanstack/react-table"
import {
  AlertCircle,
  Bell,
  FileText,
  Info,
  Terminal,
  UserPlus
} from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { FormDemo } from "./FormDemo"

type DemoUser = { id: string; name: string; email: string }

export default function UITestPage() {
  const [openBasic, setOpenBasic] = React.useState(false)
  const [openConfirm, setOpenConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const sections = [
    { id: "toast", label: "Toasts", icon: Bell },
    { id: "semantic", label: "Semantic UI", icon: Info },
    { id: "buttons", label: "Buttons+", icon: Terminal },
    { id: "forms", label: "Forms", icon: FileText },
    { id: "dialogs", label: "Dialogs", icon: AlertCircle },
    { id: "atomic", label: "Atomic Components", icon: FileText },
  ]

  const handleFakeDelete = () => {
    setIsDeleting(true)
    setTimeout(() => {
      setIsDeleting(false)
      setOpenConfirm(false)
    }, 2000)
  }

  return (
    <PageContainer className="py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Table of Contents - Sticky Sidebar */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase text-muted-foreground">Navigation</h2>
              <p className="text-xs text-muted-foreground">Jump to component groups</p>
            </div>
            <nav className="space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <section.icon className="size-4" />
                  {section.label}
                </a>
              ))}
            </nav>
            <div className="pt-4 border-t border-border">
               <div className="bg-muted p-3 rounded-lg border border-border flex items-center justify-between">
                  <span className="text-xs font-medium">Theme</span>
                  <ThemeSwitch />
               </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-20">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">UI Design System</h1>
            <p className="text-muted-foreground">Reference guide for Trading Lab components and patterns.</p>
          </div>

          {/* 0. TOAST SYSTEM */}
          <section id="toast" className="scroll-mt-24 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="size-6 text-primary" /> Toast Notification System
              </h2>
              <p className="text-muted-foreground">Global feedback system for asynchronous actions and system alerts.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => toast("Cái này là thông báo mặc định nè!")}
              >
                Default Toast
              </Button>
              <Button 
                variant="success" 
                mode="subtle"
                onClick={() => toast.success("Chúc mừng!", { description: "Hệ thống đã ghi nhận thành công." })}
              >
                Success Toast
              </Button>
              <Button 
                variant="warning" 
                mode="subtle"
                onClick={() => toast.warning("Cẩn thận!", { description: "Bộ nhớ sắp đầy." })}
              >
                Warning Toast
              </Button>
              <Button 
                variant="destructive" 
                mode="subtle"
                onClick={() => toast.error("Lỗi hệ thống!", { description: "Không thể kết nối server." })}
              >
                Error Toast
              </Button>
            </div>
          </section>

          {/* 1. SEMANTIC COLORS & MODES */}
          <section id="semantic" className="scroll-mt-24 space-y-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Info className="size-5 text-primary" /> Semantic Component System
              </h2>
              <p className="text-sm text-muted-foreground">Standardized color intents and visual modes across all UI atoms.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">1.1 Button Variations</h3>
                <p className="text-sm text-muted-foreground">Supported props: <code>variant</code> (success | warning | info | destructive) and <code>mode</code> (solid | subtle | outline).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-3">
                  <p className="text-xs uppercase font-bold text-success">Success</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="success">Solid</Button>
                    <Button variant="success" mode="subtle">Subtle</Button>
                    <Button variant="success" mode="outline">Outline</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase font-bold text-warning">Warning</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="warning">Solid</Button>
                    <Button variant="warning" mode="subtle">Subtle</Button>
                    <Button variant="warning" mode="outline">Outline</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase font-bold text-info">Info</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="info">Solid</Button>
                    <Button variant="info" mode="subtle">Subtle</Button>
                    <Button variant="info" mode="outline">Outline</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase font-bold text-destructive">Destructive</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="destructive">Solid</Button>
                    <Button variant="destructive" mode="subtle">Subtle</Button>
                    <Button variant="destructive" mode="outline">Outline</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">1.2 Badge System</h3>
                <p className="text-sm text-muted-foreground">Status indicators using same semantic logic as buttons.</p>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Solid</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success">Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="destructive">Error</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Subtle</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success" mode="subtle">Active</Badge>
                      <Badge variant="warning" mode="subtle">Pending</Badge>
                      <Badge variant="info" mode="subtle">New</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Outline</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="info" mode="outline">Blue</Badge>
                      <Badge variant="destructive" mode="outline">Error</Badge> 
                      <Badge variant="success" mode="outline">Success</Badge> 
                      <Badge variant="warning" mode="outline">Warning</Badge> 
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. BUTTON EXTENSIONS */}
          <section id="buttons" className="scroll-mt-24 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Terminal className="size-5 text-primary" /> Functional Button extensions
              </h2>
              <p className="text-sm text-muted-foreground">Special states and icon handling for the core Button component.</p>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                 <p className="text-xs text-muted-foreground uppercase font-bold">Default</p>
                 <Button>Save Changes</Button>
              </div>
              <div className="space-y-2">
                 <p className="text-xs text-muted-foreground uppercase font-bold">Loading</p>
                 <Button loading>Processing</Button>
              </div>
              <div className="space-y-2">
                 <p className="text-xs text-muted-foreground uppercase font-bold">Icons</p>
                 <div className="flex gap-2">
                    <Button startIcon={<FileText />}>Export</Button>
                    <Button endIcon={<UserPlus />}>Add</Button>
                    <Button iconOnly variant="outline"><Bell /></Button>
                 </div>
              </div>
            </div>
          </section>

          {/* 3. FORM SYSTEM */}
          <section id="forms" className="scroll-mt-24 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                <FileText className="size-5" /> Standard Form System
              </h2>
              <p className="text-sm text-muted-foreground">Building forms using <code>react-hook-form</code> and <code>zod</code>.</p>
            </div>
            
            <div className="space-y-4">
               <h3 className="text-lg font-semibold">3.1 Complex Form Pattern</h3>
                <FormDemo />
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-semibold">3.2 Quick Entry (Inline)</h3>
               <InlineFormDemo />
            </div>
          </section>

          {/* 4. DIALOG & MODALS */}
          <section id="dialogs" className="scroll-mt-24 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertCircle className="size-5 text-primary" /> Overlay Patterns
              </h2>
              <p className="text-sm text-muted-foreground">Dialogs, Modals, and confirmation prompts using Radix UI primitives.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase font-bold">Standard Form</p>
                    <DialogFormDemo />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase font-bold">Long Form (Scroll)</p>
                    <LongFormDialogDemo />
                  </div>
               </div>

               <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase font-bold">Specialized</p>
                  <div className="flex flex-wrap gap-2">
                    <DialogWithFooterDemo />

                    <Dialog open={openBasic} onOpenChange={setOpenBasic}>
                      <DialogTrigger asChild>
                        <Button variant="outline">Scrollable</Button>
                      </DialogTrigger>
                      <DialogContent size="md">
                        <DialogHeader icon={FileText}>
                          <DialogTitle>Document Review</DialogTitle>
                          <DialogDescription>Testing long-content scroll behavior.</DialogDescription>
                        </DialogHeader>
                        <DialogBody className="h-48">
                          {Array.from({length: 20}).map((_, i) => (
                            <p key={i} className="text-xs text-muted-foreground mb-2">Ref {i+1}: Standard legal boilerplate text for testing scroll regions. This should now scroll correctly within the fixed height container.</p>
                          ))}
                        </DialogBody>
                      </DialogContent>
                    </Dialog>

                    <Button variant="destructive" onClick={() => setOpenConfirm(true)}>Confirm</Button>
                    <ConfirmDialog
                      open={openConfirm}
                      onCancel={() => setOpenConfirm(false)}
                      onConfirm={handleFakeDelete}
                      title="Permanently Delete?"
                      description="This action cannot be undone."
                      confirmText="Yes, Proceed"
                      variant="destructive"
                      loading={isDeleting}
                    />
                  </div>
               </div>
            </div>
          </section>

          {/* 5. ATOMIC COMPONENTS */}
          <section id="atomic" className="scroll-mt-24 space-y-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                <FileText className="size-5" /> Atomic Building Blocks
              </h2>
              <p className="text-sm text-muted-foreground">Common UI atoms used to compose complex interfaces.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Inputs */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Inputs</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <Label className="text-xs">Password Field</Label>
                       <PasswordInput placeholder="••••••••" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-xs">Search (Debounced)</Label>
                       <SearchInput 
                          placeholder="Type to search..." 
                          value={searchValue}
                          onChange={setSearchValue}
                       />
                       {searchValue && <p className="text-xs text-info italic">Captured: {searchValue}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Data Table</h3>
                <DataTableDemo />
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageContainer>
  )
}

function DataTableDemo() {
  const columns: ColumnDef<DemoUser>[] = [
    { id: "name", header: "Name", accessorKey: "name" },
    { id: "email", header: "Email", accessorKey: "email" },
  ]
  const data: DemoUser[] = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
    { id: "3", name: "Carol", email: "carol@example.com" },
  ]
  return (
     <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search by name..."
        emptyTitle="No users"
        emptyDescription="No users match your search."
      />
  )
}

const inlineFormSchema = z.object({ email: z.string().email("Invalid email") })
type InlineFormValues = z.infer<typeof inlineFormSchema>

function InlineFormDemo() {
  const form = useForm<InlineFormValues>({
    resolver: zodResolver(inlineFormSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = (data: InlineFormValues) => {
    toast.success(`Submitted: ${data.email}`)
  }

  return (
    <div className="max-w-md rounded-lg border border-border p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Email</FormLabel>
                <FormControl>
                  <Input id="fw-email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" loading={form.formState.isSubmitting} fullWidth>
            Submit
          </Button>
        </form>
      </Form>
    </div>
  )
}

const dialogFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

type DialogFormValues = z.infer<typeof dialogFormSchema>

function DialogFormDemo() {
  const [open, setOpen] = React.useState(false)
  const form = useForm<DialogFormValues>({
    resolver: zodResolver(dialogFormSchema),
    defaultValues: { name: "", email: "" },
  })

  const onSubmit = async (data: DialogFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success(`User created: ${data.name} (${data.email})`)
    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="info" mode="subtle">Open Dialog with Form</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader icon={UserPlus}>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new user to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
function DialogWithFooterDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">With Footer</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader icon={Info}>
          <DialogTitle>Information</DialogTitle>
          <DialogDescription>This is a simple dialog with a footer.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm">The footer below can contain multiple actions and is sticky to the bottom when content exceeds viewport.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline">Remind me later</Button>
          <Button>Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const longFormSchema = z.object({
  field1: z.string().min(1, "Required"),
  field2: z.string().min(1, "Required"),
  field3: z.string().min(1, "Required"),
  field4: z.string().min(1, "Required"),
  field5: z.string().min(1, "Required"),
  field6: z.string().min(1, "Required"),
})

type LongFormValues = z.infer<typeof longFormSchema>

function LongFormDialogDemo() {
  const [open, setOpen] = React.useState(false)
  const form = useForm<LongFormValues>({
    resolver: zodResolver(longFormSchema),
    defaultValues: { field1: "", field2: "", field3: "", field4: "", field5: "", field6: "" },
  })

  const onSubmit = async (data: LongFormValues) => {
    toast.success("Form submitted!", { description: `Received ${Object.keys(data).length} parameters.` })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="info" mode="outline">Long Form</Button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader icon={FileText}>
          <DialogTitle>Long Form Configuration</DialogTitle>
          <DialogDescription>Testing auto-scrolling behavior with many fields.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="max-h-[300px]">
              {["field1", "field2", "field3", "field4", "field5", "field6"].map((f, i) => (
                <FormField
                  key={f}
                  control={form.control}
                  name={f as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Configuration Parameter {i + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder={`Enter value for ${f}...`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </DialogBody>
            <DialogFooter>
              <Button type="submit">Save Configuration</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
