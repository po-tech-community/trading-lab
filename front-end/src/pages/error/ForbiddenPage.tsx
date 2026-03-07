import { PageContainer } from "@/components/common/PageContainer"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Home, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="min-h-screen flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Card className="flex flex-col items-center">
          <CardHeader className="w-full text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center size-16 rounded-lg bg-destructive/10 text-destructive">
                <Lock className="size-8" aria-hidden />
              </div>
            </div>
            <p className="text-7xl font-bold tracking-tight text-destructive">
              403
            </p>
            <CardTitle className="text-xl">Access denied</CardTitle>
            <CardDescription>
              You don't have permission to access this content. Please sign in
              with an authorized account or contact an administrator if you
              believe this is a mistake.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2 w-full">
            <p className="text-sm text-muted-foreground text-center">
              Some pages are only available to authenticated users or users
              with the appropriate role.
            </p>
          </CardContent>
          <CardFooter className="w-full flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              startIcon={<ArrowLeft className="size-4" />}
              onClick={() => navigate(-1)}
            >
              Go back
            </Button>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              startIcon={<Home className="size-4" />}
              onClick={() => navigate("/")}
            >
              Home
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-medium">
          Trading Lab
        </p>
      </div>
    </PageContainer>
  )
}
