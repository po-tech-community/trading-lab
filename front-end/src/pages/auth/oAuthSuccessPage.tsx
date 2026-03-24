import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const userParam = params.get("user");

        if (token) {
            localStorage.setItem("accessToken", token);
            if (userParam) {
                try {
                    localStorage.setItem("user", decodeURIComponent(userParam));
                } catch {
                    localStorage.removeItem("user");
                }
            }

            navigate("/home/portfolio");
        } else {
            navigate("/log-in")
        }
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg text-muted-foreground">Logging you in...</p>
        </div>
    )
}
