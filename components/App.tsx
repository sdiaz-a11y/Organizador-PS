"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configurado } from "@/lib/supabase";
import Auth from "./Auth";
import Board from "./Board";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!configurado) {
      setListo(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setListo(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
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
  if (!listo) return <main className="centro"><p className="suave">Un momento…</p></main>;
  return session ? <Board session={session} /> : <Auth />;
}
