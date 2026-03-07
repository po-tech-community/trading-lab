import appleIcon from "@/assets/icons/apple.svg"
import facebookIcon from "@/assets/icons/facebook.svg"
import googleIcon from "@/assets/icons/google.svg"
import { PasswordInput } from "@/components/common/PasswordInput"
import { ThemeSwitch } from "@/components/theme-switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSignUp } from "@/hooks/use-auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Lock, ShieldCheck, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { z } from "zod"

const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const signUpMutation = useSignUp()

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: SignUpValues) => {
    signUpMutation.mutate(data)
  }

  const handleGoogleSignUp = () => {
    console.log("Signing up with Google...")
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Button variant="ghost" asChild className="gap-2">
            <Link to="/">
                <ArrowLeft className="size-4" />
                Back to Landing
            </Link>
        </Button>
      </div>

      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeSwitch />
      </div>

      <div className="w-full max-w-lg space-y-8">
        {/* Branding */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center size-14 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity mx-auto">
            <UserPlus className="size-7" aria-hidden />
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Create Account
          </h1>
          <p className="text-base text-muted-foreground">
            Join Trading Lab to start simulating your investment future.
          </p>
        </div>

        {/* SignUp Card */}
        <Card className="py-8 px-8 sm:py-10 sm:px-10 overflow-hidden relative">
          <CardHeader className="p-0 pb-6 text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">Get Started</CardTitle>
            <CardDescription className="text-base">
              Create an account with your email or social media.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-5">
            {/* Manual Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>First name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Last name</FormLabel>
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
                                <FormLabel required>Email address</FormLabel>
                                <FormControl>
                                    <Input placeholder="name@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required>Password</FormLabel>
                                <FormControl>
                                    <PasswordInput placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full h-11" size="lg" loading={signUpMutation.isPending}>
                        Create Account
                    </Button>
                </form>
            </Form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-1 gap-3">
                <Button
                variant="outline"
                size="lg"
                className="w-full h-11 text-sm font-medium"
                onClick={handleGoogleSignUp}
                >
                <img src={googleIcon} alt="" className="size-4 shrink-0" aria-hidden />
                Google
                </Button>
                <div className="grid grid-cols-2 gap-3">
                    <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-11 text-sm font-medium"
                    disabled
                    >
                    <img src={facebookIcon} alt="" className="size-4 shrink-0" aria-hidden />
                    Facebook
                    </Button>
                    <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-11 text-sm font-medium"
                    disabled
                    >
                    <img src={appleIcon} alt="" className="size-4 shrink-0" aria-hidden />
                    Apple
                    </Button>
                </div>
            </div>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2 pt-2">
              <ShieldCheck className="size-3.5 text-muted-foreground" aria-hidden />
              Secured by Google
              <Lock className="size-3 text-muted-foreground" aria-hidden />
              OAuth 2.0
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/log-in" className="font-medium text-primary hover:underline">Log in</Link>
        </p>

        <p className="text-center text-xs text-muted-foreground leading-relaxed px-8">
          By signing up, you agree to Trading Lab's <Link to="#" className="hover:underline">Terms of Service</Link> and <Link to="#" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
