"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const traducir = (m: string) => {
  if (/Invalid login/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/already registered/i.test(m)) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (/not confirmed/i.test(m)) return "Confirma tu correo antes de entrar: te enviamos un enlace.";
  if (/signups not allowed/i.test(m)) return "El registro está cerrado. Pide acceso a quien administra el tablero.";
  if (/at least 6/i.test(m)) return "La contraseña debe tener al menos 6 caracteres.";
  return m;
};

export default function Auth() {
  const [registro, setRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setMsg("");
    if (registro) {
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: clave,
        options: { data: { nombre: nombre.trim() } },
      });
      if (error) setMsg(traducir(error.message));
      else if (!data.session) {
        setMsg("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.");
        setRegistro(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
      if (error) setMsg(traducir(error.message));
    }
    setCargando(false);
  }

  return (
    <main className="centro">
      <form className="panel" onSubmit={enviar}>
        <h1>Organizador</h1>
        <p className="suave">Aquí viven las ideas, las notas y el avance del equipo. Entra para verlas.</p>
        {registro && (
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name" />
          </label>
        )}
        <label>
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
            minLength={6}
            autoComplete={registro ? "new-password" : "current-password"}
          />
        </label>
        {msg && <p className="aviso">{msg}</p>}
        <button className="primario" disabled={cargando}>
          {registro ? "Crear cuenta" : "Entrar"}
        </button>
        <button type="button" className="enlace" onClick={() => { setRegistro(!registro); setMsg(""); }}>
          {registro ? "Ya tengo cuenta" : "Crear una cuenta"}
        </button>
      </form>
    </main>
  );
}
