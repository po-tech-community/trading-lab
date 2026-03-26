import appleIcon from "@/assets/icons/apple.svg"
import facebookIcon from "@/assets/icons/facebook.svg"
import googleIcon from "@/assets/icons/google.svg"
import { PasswordInput } from "@/components/common/PasswordInput"
import { ThemeSwitch } from "@/components/theme-switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useLogin } from "@/hooks/use-auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Lock, LogIn, ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const loginMutation = useLogin()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginValues) => {
    form.clearErrors("root")
  
    loginMutation.mutate(data, {
      onError: (error: Error) => {
        form.setError("root", {
          message: error.message || "Invalid email or password",
        })
      },
    })
  }

  const handleGoogleLogin = () => {
    console.log("Logging in with Google...")
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
          <div className="inline-flex items-center justify-center size-14 rounded-xl bg-primary text-primary-foreground">
            <LogIn className="size-7" aria-hidden />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Trading Lab
          </h1>
          <p className="text-base text-muted-foreground text-center">
            Sign in to manage your DCA strategies and access AI insights.
          </p>
        </div>

        {/* Login Card */}
        <Card className="py-8 px-8 sm:py-10 sm:px-10 overflow-hidden relative">
          <CardHeader className="p-0 pb-6 text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
            <CardDescription className="text-base font-normal">
              Welcome back to Trading Lab.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-5">
            {/* Manual Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                <div className="flex items-center justify-between">
                                    <FormLabel required>Password</FormLabel>
                                    <Link to="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                                </div>
                                <FormControl>
                                    <PasswordInput placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-11"
                      size="lg"
                      loading={loginMutation.isPending}
                      disabled={loginMutation.isPending}
                    >
                      Sign In
                    </Button>
                    {form.formState.errors.root && (
                      <p className="text-sm text-destructive text-center">
                        {form.formState.errors.root.message}
                      </p>
                    )}
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
                onClick={handleGoogleLogin}
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
            Don't have an account?{" "}
            <Link to="/sign-up" className="font-medium text-primary hover:underline">Sign up</Link>
        </p>

        <p className="text-center text-xs text-muted-foreground leading-relaxed px-8">
          By signing in, you agree to Trading Lab's <Link to="#" className="hover:underline">Terms of Service</Link> and <Link to="#" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
