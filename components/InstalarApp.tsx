"use client";

import { useEffect, useState } from "react";

type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// El navegador dispara "beforeinstallprompt" una sola vez y muy pronto, así que se guarda a nivel de módulo.
let guardado: EventoInstalar | null = null;
const oyentes = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    guardado = e as EventoInstalar;
    oyentes.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    guardado = null;
    oyentes.forEach((f) => f());
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
}

export default function InstalarApp({ className = "icono" }: { className?: string }) {
  const [, refrescar] = useState(0);
  const [instalada, setInstalada] = useState(true);
  const [ios, setIos] = useState(false);
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    const standalone =
      matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalada(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const f = () => refrescar((n) => n + 1);
    oyentes.add(f);
    return () => {
      oyentes.delete(f);
    };
  }, []);

  if (instalada || (!guardado && !ios)) return null;

  async function instalar() {
    if (guardado) {
      await guardado.prompt();
      await guardado.userChoice;
      guardado = null;
      refrescar((n) => n + 1);
    } else {
      setAyuda(true);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={instalar}>
        Instalar app
      </button>
      {ayuda && (
        <div className="instalar-ayuda" role="dialog" aria-label="Cómo instalar la app">
          <p>
            En Safari toca <strong>Compartir</strong> y luego <strong>«Añadir a pantalla de inicio»</strong>.
          </p>
          <button type="button" className="primario" onClick={() => setAyuda(false)}>
            Entendido
          </button>
        </div>
      )}
    </>
  );
}
