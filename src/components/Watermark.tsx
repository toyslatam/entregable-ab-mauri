const LABEL = "PROPIEDAD DE STRATEGEE";

export function Watermark() {
  const tiles = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="watermark-layer" aria-hidden>
      {tiles.map((i) => (
        <span key={i} className="watermark-tile">
          {LABEL}
        </span>
      ))}
    </div>
  );
}
