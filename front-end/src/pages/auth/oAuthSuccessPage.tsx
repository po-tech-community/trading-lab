import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function OAuthSuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            localStorage.setItem("accessToken", token);

            navigate("/home/porfolio");
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