"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configurado } from "@/lib/supabase";
import Auth from "./Auth";
import Byte from "./Byte";
import Board from "./Board";

// Sin red no se puede renovar un token caducado; se reutiliza la sesión guardada para consultar la copia local.
function sesionGuardada(): Session | null {
  try {
    const clave = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    const s = clave ? JSON.parse(localStorage.getItem(clave) ?? "null") : null;
    return s?.user?.id ? (s as Session) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!configurado) {
      setListo(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      let s = data.session;
      if (!s && !navigator.onLine) s = sesionGuardada();
      setSession(s);
      setListo(true);
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "INITIAL_SESSION" && !s && !navigator.onLine) return; // conserva la sesión guardada sin red
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configurado) {
    return (
      <main className="centro">
        <div className="panel">
          <h1>Falta configurar Supabase</h1>
          <p>
            Copia <code>.env.local.example</code> a <code>.env.local</code>, pon la URL y la anon key de tu proyecto y
            reinicia el servidor. Los pasos completos están en el README.
          </p>
        </div>
      </main>
    );
  }
  if (!listo) {
    return (
      <main className="centro">
        <div className="cargando">
          <Byte pose="saludando" alto={150} className="flota" />
          <p className="suave">Un momento…</p>
        </div>
      </main>
    );
  }
  return session ? <Board session={session} /> : <Auth />;
}
