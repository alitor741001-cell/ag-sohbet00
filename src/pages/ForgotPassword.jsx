import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import "@/components/auth/blueAuth.css";

const ART = "https://media.base44.com/images/public/6a77d66e4da6de214628ee62/ed1e8f656_IMG_0300.jpg";
// Tasarım görseli 575x1024; alanlar görseldeki çizimlerin üstüne oturur.
const zone = (x1, y1, x2, y2) => ({ left: `${x1 / 5.75}%`, top: `${y1 / 10.24}%`, width: `${(x2 - x1) / 5.75}%`, height: `${(y2 - y1) / 10.24}%` });

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Hesabın var olup olmadığı gizli kalır
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <main className="blue-auth">
      <div
        className="blue-auth-stage"
        style={{ backgroundImage: `url(${ART})`, width: "min(100vw, calc(var(--app-height, 100dvh) * 575 / 1024))", aspectRatio: "575 / 1024" }}
      >
        <form onSubmit={handleSubmit} className="contents">
          <input
            aria-label="E-posta adresiniz"
            type="email"
            placeholder=" "
            autoComplete="email"
            className="blue-auth-input absolute"
            style={{ ...zone(137, 544, 438, 583), paddingLeft: "13cqw" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" aria-label="Sıfırlama Bağlantısı Gönder" className="blue-auth-hit absolute" style={zone(137, 606, 438, 649)} disabled={loading}>
            Sıfırlama Bağlantısı Gönder
          </button>
        </form>
        <Link aria-label="Giriş Yap sayfasına dön" className="blue-auth-hit absolute" style={zone(200, 664, 380, 694)} to="/login">
          Giriş Yap sayfasına dön
        </Link>
        {sent && (
          <div
            className="absolute flex items-center justify-center text-center"
            style={{ ...zone(137, 536, 438, 656), background: "#030618", borderRadius: "5cqw", boxShadow: "inset 0 0 0 2px #3b6dff", color: "#f5f8ff", fontSize: "3.4cqw", padding: "3cqw" }}
          >
            Bu e-posta ile bir hesap varsa, sıfırlama bağlantısı kısa süre içinde gönderilecek.
          </div>
        )}
      </div>
    </main>
  );
}