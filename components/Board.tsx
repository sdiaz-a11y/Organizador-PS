"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { esErrorDeRed, guardarCache, leerCache, limpiarCache } from "@/lib/cache";
import { CONSEJOS, ESTADOS, TIPOS, nombreEstado, nombreTipo } from "@/lib/types";
import type { Estado, Perfil, Tarea } from "@/lib/types";
import Byte from "./Byte";
import InstalarApp from "./InstalarApp";
import TaskDrawer from "./TaskDrawer";

const sigEstado = (e: Estado) => ESTADOS[ESTADOS.findIndex((x) => x.id === e) + 1]?.id;

const iniciales = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

export default function Board({ session }: { session: Session }) {
  const yo = session.user.id;
  const [tareas, setTareas] = useState<Tarea[]>(() => leerCache<Tarea[]>("tareas") ?? []);
  const [perfiles, setPerfiles] = useState<Perfil[]>(() => leerCache<Perfil[]>("perfiles") ?? []);
  const [enLinea, setEnLinea] = useState(() => navigator.onLine);
  const [sync, setSync] = useState<string | null>(() => leerCache<string>("sync"));
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [busca, setBusca] = useState("");
  const [fResp, setFResp] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Estado | null>(null);
  const [tema, setTema] = useState<"light" | "dark">("light");
  const [festejo, setFestejo] = useState(false);
  const [activa, setActiva] = useState<Estado>("idea");
  const [consejo, setConsejo] = useState(0);

  useEffect(() => {
    setConsejo(Math.floor(Math.random() * CONSEJOS.length));
  }, []);

  useEffect(() => {
    if (!festejo) return;
    const id = setTimeout(() => setFestejo(false), 3200);
    return () => clearTimeout(id);
  }, [festejo]);

  useEffect(() => {
    setTema(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const cargar = useCallback(async () => {
    const [t, p] = await Promise.all([
      supabase.from("tareas").select("*"),
      supabase.from("perfiles").select("id,nombre"),
    ]);
    if (t.error) {
      if (esErrorDeRed(t.error.message)) return setEnLinea(false);
      return setError(`No se pudo cargar el tablero: ${t.error.message}`);
    }
    setEnLinea(true);
    setError("");
    setTareas(t.data as Tarea[]);
    setPerfiles((p.data ?? []) as Perfil[]);
  }, []);

  useEffect(() => {
    if (!enLinea) return;
    guardarCache("tareas", tareas);
    guardarCache("perfiles", perfiles);
    const ahora = new Date().toISOString();
    guardarCache("sync", ahora);
    setSync(ahora);
  }, [tareas, perfiles, enLinea]);

  useEffect(() => {
    setEnLinea(navigator.onLine);
    const dentro = async () => {
      await supabase.auth.getSession(); // renueva el token si caducó mientras no había red
      setEnLinea(true);
      cargar();
    };
    const fuera = () => setEnLinea(false);
    window.addEventListener("online", dentro);
    window.addEventListener("offline", fuera);
    return () => {
      window.removeEventListener("online", dentro);
      window.removeEventListener("offline", fuera);
    };
  }, [cargar]);

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
    if (!titulo || !enLinea) return;
    setNuevo("");
    const { data, error } = await supabase.from("tareas").insert({ titulo }).select().single();
    if (error) return setError(error.message);
    setTareas((ts) => (ts.some((x) => x.id === data.id) ? ts : [...ts, data as Tarea]));
    setAbierta(data.id);
  }

  async function mover(id: string, estado: Estado, antesDe?: string) {
    const t = tareas.find((x) => x.id === id);
    if (!t || !enLinea) return;
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
      if (estado === "hecho") setFestejo(true);
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
        <div className="marca">
          <img src="/byte/logo.png" alt="" width={36} height={36} />
          <h1>
            Organizador <span className="suave">· Soporte técnico</span>
          </h1>
        </div>
        <div className="barra-der">
          <span className="suave chico">{nombre(yo)}</span>
          <InstalarApp />
          <button
            className="icono"
            onClick={alternarTema}
            aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {tema === "dark" ? "☀" : "☾"}
          </button>
          <button
            className="icono"
            onClick={() => {
              limpiarCache();
              supabase.auth.signOut();
            }}
          >
            Salir
          </button>
        </div>
      </header>

      {!enLinea && (
        <p className="sin-red" role="status">
          Sin conexión. Estás viendo lo último guardado en este dispositivo
          {sync ? ` (${new Date(sync).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })})` : ""}
          . Podrás editar cuando vuelva el internet.
        </p>
      )}

      <form className="nueva" onSubmit={agregar}>
        <input
          disabled={!enLinea}
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Escribe una idea…"
          aria-label="Nueva idea"
        />
        <button className="primario" disabled={!nuevo.trim() || !enLinea}>
          Agregar
        </button>
      </form>

      <div className="filtros">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" aria-label="Buscar" />
        <select value={fResp} onChange={(e) => setFResp(e.target.value)} aria-label="Responsable">
          <option value="">Responsable</option>
          <option value="sin">Sin asignar</option>
          {perfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} aria-label="Tipo">
          <option value="">Tipo</option>
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="aviso">{error}</p>}

      {tareas.length === 0 && !error && (
        <div className="bienvenida">
          <Byte pose="laptop" alto={120} />
          <div>
            <h2>Aún no hay ideas</h2>
            <p className="suave">Soy Byte. Escribe la primera idea arriba y la ponemos a trabajar.</p>
          </div>
        </div>
      )}

      <div className="pestanas" role="tablist" aria-label="Pasos del flujo">
        {ESTADOS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={activa === c.id}
            className={activa === c.id ? "activa" : ""}
            onClick={() => setActiva(c.id)}
          >
            <span className="cuenta">{visibles.filter((t) => t.estado === c.id).length}</span>
            {c.corto}
          </button>
        ))}
      </div>

      <main className="tablero">
        {ESTADOS.map((col) => {
          const items = visibles.filter((t) => t.estado === col.id);
          return (
            <section
              key={col.id}
              id={`col-${col.id}`}
              className={`columna${sobre === col.id ? " sobre" : ""}${activa === col.id ? " activa" : ""}`}
              role="tabpanel"
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
              {items.length === 0 && (
                <div className="vacio">
                  <Byte pose={col.pose} alto={84} />
                  <p>{col.ayuda}</p>
                </div>
              )}
              {items.map((t) => (
                <article
                  key={t.id}
                  className={`tarjeta p-${t.prioridad}${arrastrando === t.id ? " arrastrando" : ""}`}
                  draggable={enLinea}
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
                  {enLinea && sigEstado(t.estado) && (
                    <button
                      type="button"
                      className="siguiente"
                      onClick={(e) => {
                        e.stopPropagation();
                        mover(t.id, sigEstado(t.estado)!);
                      }}
                    >
                      Pasar a {nombreEstado(sigEstado(t.estado)!)} →
                    </button>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </main>

      <footer className="consejo">
        <Byte pose="guino" alto={64} />
        <p>
          <strong>Consejo de Byte:</strong> {CONSEJOS[consejo]}
        </p>
      </footer>

      {festejo && (
        <div className="festejo" role="status">
          <Byte pose="celebrando" alto={110} />
          <p>¡Buen trabajo, equipo!</p>
        </div>
      )}

      {sel && (
        <TaskDrawer
          key={sel.id}
          tarea={sel}
          perfiles={perfiles}
          yo={yo}
          enLinea={enLinea}
          nombre={nombre}
          alCerrar={() => setAbierta(null)}
          alError={setError}
        />
      )}
    </div>
  );
}
