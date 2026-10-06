import React from "react";

/**
 * Giriş / kayıt ekranı arka planı: ana sayfadaki gibi antrasit zemin üzerinde
 * altın ve kırmızı premium ışıklar.
 */
export default function AuthBackground({ children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-anthracite px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-premium-red/20 blur-3xl" />
        <div className="absolute -right-20 top-16 h-64 w-64 rounded-full bg-premium-gold/15 blur-3xl" />
        <div className="absolute bottom-8 left-1/4 h-64 w-64 rounded-full bg-premium-gold-deep/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-premium-gold/12 via-transparent to-premium-red/20" />
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}