import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold">Welcome to Participium</h1>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
