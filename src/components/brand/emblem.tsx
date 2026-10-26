/**
 * Símbolo de LA EME: la M estilizada que va debajo del wordmark en la etiqueta.
 * Reconstrucción vectorial aproximada a partir de la imagen de referencia; reemplazar
 * por el archivo vectorial oficial del diseñador cuando esté disponible.
 */
type EmblemProps = {
  className?: string;
  title?: string;
};

export function LaEmeEmblem({ className, title = "LA EME" }: EmblemProps) {
  return (
    <svg
      viewBox="0 0 100 64"
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={className}
      fill="currentColor"
    >
      <path d="M6 60V4h16l28 34L78 4h16v56H81V24L57 52h-14L19 24v36z" />
      <path d="M6 4h16v4H6zM78 4h16v4H78z" opacity="0.6" />
    </svg>
  );
}
