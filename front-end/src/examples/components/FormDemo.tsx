import { PasswordInput } from "@/components/common/PasswordInput"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const userSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
})

type UserFormValues = z.infer<typeof userSchema>

export function FormDemo() {
  const [globalError, setGlobalError] = React.useState<string | null>(null)
  const [mode, setMode] = React.useState<"create" | "edit">("create")

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  })

  // Update form values when mode changes (mimicking the old FormWrapper reset logic)
  React.useEffect(() => {
    if (mode === "edit") {
      form.reset({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "",
      })
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      })
    }
  }, [mode, form])

  const onSubmit = async (data: UserFormValues) => {
    // Fake API call to simulate server validation
    try {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (data.email === "error@test.com") {
            setGlobalError("Email already exists in the system. Try another one.")
            reject()
          } else {
            setGlobalError(null)
            alert(`Form successfully submitted in ${mode} mode:\n\n${JSON.stringify(data, null, 2)}`)
            resolve()
          }
        }, 1500)
      })
    } catch (error) {
      console.error(error)
    }
  }

  const { isSubmitting } = form.formState

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {mode === "create" ? "Create User" : "Edit User"}
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setMode(prev => prev === "create" ? "edit" : "create")}
        >
          Toggle to {mode === "create" ? "Edit" : "Create"} Mode
        </Button>
      </div>

      {globalError && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {globalError}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 border shadow-xs rounded-xl p-6">
          <fieldset disabled={isSubmitting} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormDescription>Legal first name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>Minimum 8 characters required</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button type="submit" loading={isSubmitting} fullWidth>
                {mode === "create" ? "Save User" : "Update User"}
              </Button>
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  )
}
