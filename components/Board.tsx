"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ESTADOS, TIPOS, nombreEstado, nombreTipo } from "@/lib/types";
import type { Estado, Perfil, Tarea } from "@/lib/types";
import TaskDrawer from "./TaskDrawer";

const iniciales = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

export default function Board({ session }: { session: Session }) {
  const yo = session.user.id;
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [busca, setBusca] = useState("");
  const [fResp, setFResp] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Estado | null>(null);
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTema(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const cargar = useCallback(async () => {
    const [t, p] = await Promise.all([
      supabase.from("tareas").select("*"),
      supabase.from("perfiles").select("id,nombre"),
    ]);
    if (t.error) return setError(`No se pudo cargar el tablero: ${t.error.message}`);
    setError("");
    setTareas(t.data as Tarea[]);
    setPerfiles((p.data ?? []) as Perfil[]);
  }, []);

  useEffect(() => {
    cargar();
    const canal = supabase
      .channel("tablero")
      .on("postgres_changes", { event: "*", schema: "public", table: "tareas" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id: string }).id;
          setTareas((ts) => ts.filter((x) => x.id !== id));
          setAbierta((a) => (a === id ? null : a));
        } else {
          const t = payload.new as Tarea;
          setTareas((ts) => (ts.some((x) => x.id === t.id) ? ts.map((x) => (x.id === t.id ? t : x)) : [...ts, t]));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "perfiles" }, () => cargar())
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [cargar]);

  const nombre = useCallback(
    (id: string | null) => perfiles.find((p) => p.id === id)?.nombre ?? "Alguien",
    [perfiles]
  );

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return tareas
      .filter((t) => !fResp || (fResp === "sin" ? !t.responsable : t.responsable === fResp))
      .filter((t) => !fTipo || t.tipo === fTipo)
      .filter((t) => !q || t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q))
      .sort((a, b) => a.orden - b.orden);
  }, [tareas, busca, fResp, fTipo]);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    const titulo = nuevo.trim();
    if (!titulo) return;
    setNuevo("");
    const { data, error } = await supabase.from("tareas").insert({ titulo }).select().single();
    if (error) return setError(error.message);
    setTareas((ts) => (ts.some((x) => x.id === data.id) ? ts : [...ts, data as Tarea]));
    setAbierta(data.id);
  }

  async function mover(id: string, estado: Estado, antesDe?: string) {
    const t = tareas.find((x) => x.id === id);
    if (!t) return;
    const col = tareas.filter((x) => x.estado === estado && x.id !== id).sort((a, b) => a.orden - b.orden);
    let orden: number;
    const i = antesDe ? col.findIndex((x) => x.id === antesDe) : -1;
    if (i === -1) orden = (col.at(-1)?.orden ?? 0) + 1000;
    else orden = i === 0 ? col[0].orden - 1000 : (col[i - 1].orden + col[i].orden) / 2;

    const cambioEstado = t.estado !== estado;
    setTareas((ts) => ts.map((x) => (x.id === id ? { ...x, estado, orden } : x)));
    const { error } = await supabase.from("tareas").update({ estado, orden }).eq("id", id);
    if (error) {
      setError(error.message);
      cargar();
      return;
    }
    if (cambioEstado) {
      await supabase.from("notas").insert({
        tarea_id: id,
        sistema: true,
        texto: `${nombre(yo)} movió la tarea de «${nombreEstado(t.estado)}» a «${nombreEstado(estado)}».`,
      });
    }
  }

  function alternarTema() {
    const t = tema === "dark" ? "light" : "dark";
    setTema(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }

  const sel = tareas.find((t) => t.id === abierta) ?? null;

  return (
    <div className="app">
      <header className="barra">
        <h1>
          Organizador <span className="suave">· Soporte técnico</span>
        </h1>
        <div className="barra-der">
          <span className="suave chico">{nombre(yo)}</span>
          <button
            className="icono"
            onClick={alternarTema}
            aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {tema === "dark" ? "☀" : "☾"}
          </button>
          <button className="icono" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </div>
      </header>

      <form className="nueva" onSubmit={agregar}>
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Escribe una idea y presiona Enter…"
          aria-label="Nueva idea"
        />
        <button className="primario" disabled={!nuevo.trim()}>
          Agregar
        </button>
      </form>

      <div className="filtros">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" aria-label="Buscar" />
        <select value={fResp} onChange={(e) => setFResp(e.target.value)} aria-label="Responsable">
          <option value="">Todos los responsables</option>
          <option value="sin">Sin asignar</option>
          {perfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} aria-label="Tipo">
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="aviso">{error}</p>}

      <main className="tablero">
        {ESTADOS.map((col) => {
          const items = visibles.filter((t) => t.estado === col.id);
          return (
            <section
              key={col.id}
              className={`columna${sobre === col.id ? " sobre" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(col.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setSobre(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setSobre(null);
                if (arrastrando) mover(arrastrando, col.id);
                setArrastrando(null);
              }}
            >
              <h2>
                {col.nombre} <span className="cuenta">{items.length}</span>
              </h2>
              {items.length === 0 && <p className="vacio">{col.ayuda}</p>}
              {items.map((t) => (
                <article
                  key={t.id}
                  className={`tarjeta p-${t.prioridad}${arrastrando === t.id ? " arrastrando" : ""}`}
                  draggable
                  tabIndex={0}
                  onDragStart={() => setArrastrando(t.id)}
                  onDragEnd={() => {
                    setArrastrando(null);
                    setSobre(null);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSobre(null);
                    if (arrastrando && arrastrando !== t.id) mover(arrastrando, col.id, t.id);
                    setArrastrando(null);
                  }}
                  onClick={() => setAbierta(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setAbierta(t.id);
                  }}
                >
                  <p className="titulo">{t.titulo}</p>
                  <div className="meta">
                    <span className="tag">{nombreTipo(t.tipo)}</span>
                    <span className="prio">{t.prioridad}</span>
                    {t.responsable && (
                      <span className="avatar" title={nombre(t.responsable)}>
                        {iniciales(nombre(t.responsable))}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </main>

      {sel && (
        <TaskDrawer
          key={sel.id}
          tarea={sel}
          perfiles={perfiles}
          yo={yo}
          nombre={nombre}
          alCerrar={() => setAbierta(null)}
          alError={setError}
        />
      )}
    </div>
  );
}
