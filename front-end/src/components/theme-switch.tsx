import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch as SwitchPrimitives } from "radix-ui"
import * as React from "react"

export function ThemeSwitch() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Wait for hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-[50px] h-[26px] shrink-0" />
  }

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDark = currentTheme === "dark"

  return (
    <SwitchPrimitives.Root
      checked={isDark}
      onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
      className={cn(
        "peer inline-flex shrink-0 items-center justify-between rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "w-[50px] h-[26px] bg-input dark:bg-zinc-800 shadow-inner relative"
      )}
    >
      {/* Track Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <Sun className="h-3 w-3 text-muted-foreground mr-auto" />
        <Moon className="h-3 w-3 text-muted-foreground ml-auto" />
      </div>

      {/* Thumb */}
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0 relative z-10 flex items-center justify-center"
        )}
      >
        {isDark ? (
           <Moon className="h-3 w-3 text-foreground" />
        ) : (
           <Sun className="h-3 w-3 text-foreground" />
        )}
      </SwitchPrimitives.Thumb>
      
      <span className="sr-only">Toggle theme</span>
    </SwitchPrimitives.Root>
  )
}
