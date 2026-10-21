"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ESTADOS, PRIORIDADES, TIPOS, nombreEstado } from "@/lib/types";
import type { Estado, Nota, Perfil, Tarea } from "@/lib/types";

interface Props {
  tarea: Tarea;
  perfiles: Perfil[];
  yo: string;
  nombre: (id: string | null) => string;
  alCerrar: () => void;
  alError: (m: string) => void;
}

const fecha = (s: string) =>
  new Date(s).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function TaskDrawer({ tarea, perfiles, yo, nombre, alCerrar, alError }: Props) {
  const [titulo, setTitulo] = useState(tarea.titulo);
  const [descripcion, setDescripcion] = useState(tarea.descripcion);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    let vivo = true;
    supabase
      .from("notas")
      .select("*")
      .eq("tarea_id", tarea.id)
      .order("created_at")
      .then(({ data }) => {
        if (vivo) setNotas((data ?? []) as Nota[]);
      });
    const canal = supabase
      .channel(`notas-${tarea.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notas", filter: `tarea_id=eq.${tarea.id}` },
        (p) => setNotas((ns) => (ns.some((n) => n.id === (p.new as Nota).id) ? ns : [...ns, p.new as Nota]))
      )
      .subscribe();
    return () => {
      vivo = false;
      supabase.removeChannel(canal);
    };
  }, [tarea.id]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [alCerrar]);

  async function guardar(campos: Partial<Tarea>) {
    const { error } = await supabase.from("tareas").update(campos).eq("id", tarea.id);
    if (error) alError(error.message);
  }

  async function registrar(texto: string) {
    await supabase.from("notas").insert({ tarea_id: tarea.id, sistema: true, texto });
  }

  async function cambiarEstado(estado: Estado) {
    if (estado === tarea.estado) return;
    await guardar({ estado });
    await registrar(
      `${nombre(yo)} movió la tarea de «${nombreEstado(tarea.estado)}» a «${nombreEstado(estado)}».`
    );
  }

  async function cambiarResponsable(id: string) {
    await guardar({ responsable: id || null });
    await registrar(
      id ? `${nombre(yo)} asignó la tarea a ${nombre(id)}.` : `${nombre(yo)} quitó el responsable.`
    );
  }

  async function agregarNota(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    const { data, error } = await supabase.from("notas").insert({ tarea_id: tarea.id, texto: t }).select().single();
    if (error) return alError(error.message);
    setNotas((ns) => (ns.some((n) => n.id === data.id) ? ns : [...ns, data as Nota]));
  }

  async function eliminar() {
    if (!confirm("¿Eliminar esta tarea y todas sus notas?")) return;
    const { error } = await supabase.from("tareas").delete().eq("id", tarea.id);
    if (error) alError(error.message);
    else alCerrar();
  }

  return (
    <div className="fondo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <aside className="cajon" role="dialog" aria-label="Detalle de la tarea">
        <div className="cajon-cab">
          <h2>Detalle de la idea</h2>
          <button className="icono" onClick={alCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <label>
          Título
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onBlur={() => titulo.trim() && titulo !== tarea.titulo && guardar({ titulo: titulo.trim() })}
          />
        </label>

        <div className="rejilla">
          <label>
            Estado
            <select value={tarea.estado} onChange={(e) => cambiarEstado(e.target.value as Estado)}>
              {ESTADOS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsable
            <select value={tarea.responsable ?? ""} onChange={(e) => cambiarResponsable(e.target.value)}>
              <option value="">Sin asignar</option>
              {perfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridad
            <select
              value={tarea.prioridad}
              onChange={(e) => guardar({ prioridad: e.target.value as Tarea["prioridad"] })}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select value={tarea.tipo} onChange={(e) => guardar({ tipo: e.target.value as Tarea["tipo"] })}>
              {TIPOS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Descripción
          <textarea
            rows={5}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            onBlur={() => descripcion !== tarea.descripcion && guardar({ descripcion })}
            placeholder="Qué se necesita, contexto, enlaces…"
          />
        </label>

        <h3>Notas y avance</h3>
        <ul className="notas">
          {notas.length === 0 && <li className="vacio">Aún no hay notas. Anota qué se hizo y qué sigue.</li>}
          {notas.map((n) => (
            <li key={n.id} className={n.sistema ? "sistema" : ""}>
              {!n.sistema && <strong>{nombre(n.autor)}</strong>}{" "}
              <span className="suave chico">{fecha(n.created_at)}</span>
              <p>{n.texto}</p>
            </li>
          ))}
        </ul>
        <form className="nueva" onSubmit={agregarNota}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Agregar una nota…"
            aria-label="Nueva nota"
          />
          <button className="primario" disabled={!texto.trim()}>
            Anotar
          </button>
        </form>

        <button className="peligro" onClick={eliminar}>
          Eliminar tarea
        </button>
      </aside>
    </div>
  );
}
