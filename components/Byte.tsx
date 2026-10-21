export type PoseByte =
  | "laptop" | "presentando" | "datos" | "serio" | "guino"
  | "pensando" | "celebrando" | "saludando";

export default function Byte({ pose, alto, className = "" }: { pose: PoseByte; alto: number; className?: string }) {
  return (
    <img
      className={`byte ${className}`}
      src={`/byte/${pose}.webp`}
      alt=""
      aria-hidden="true"
      height={alto}
      style={{ height: alto, width: "auto" }}
      draggable={false}
    />
  );
}
