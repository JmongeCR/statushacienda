import { useEffect, useMemo, useState } from "react";

function formatDateCR(iso) {
  try {
    return new Date(iso).toLocaleString("es-CR", { hour12: true });
  } catch {
    return "—";
  }
}

function pillClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "UP") return "pill up";
  if (s === "DOWN") return "pill down";
  return "pill unknown";
}

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const base = import.meta.env.BASE_URL; // 👈 /statushacienda/ en GitHub Pages

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const url = `${base}status.json?ts=${Date.now()}`; // 👈 la ruta correcta
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr(String(e?.message || e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // cada 60s
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const services = useMemo(() => data?.services || [], [data]);
  const upCount = useMemo(
    () => services.filter((s) => String(s.status).toUpperCase() === "UP").length,
    [services]
  );

  return (
    <div className="page">
      <div className="hero">
        <h1 className="title">StatusHacienda</h1>
        <div className="subtitle">
          Monitoreo simple de endpoints y utilidades (CABYS / TC / validaciones)
        </div>

        <div className="topRow">
          <div className="meta">
            <div className="metaLine">
              <span className="metaLabel">Última actualización:</span>{" "}
              <span className="metaValue">
                {data?.generatedAt ? formatDateCR(data.generatedAt) : "—"}
              </span>
            </div>

            {err ? (
              <div className="warn">
                ⚠️ Error cargando <a href={`${base}status.json`} target="_blank" rel="noreferrer">status.json</a>:{" "}
                <span style={{ opacity: 0.9 }}>{err}</span>
              </div>
            ) : null}

            <div className="metaLine">
              <span className="metaLabel">Incidentes detectados:</span>{" "}
              <span className="metaValue">{upCount}/{services.length} servicios UP</span>
            </div>

            <div className="metaLine" style={{ opacity: 0.85 }}>
              Actualizado automáticamente (cada 60s) • GitHub Pages
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        {loading && !data ? (
          <div className="card">
            <div className="cardTitle">Cargando…</div>
          </div>
        ) : null}

        {services.map((s) => (
          <div key={s.id} className="card">
            <div className="cardHeader">
              <div className="cardTitle">{s.name}</div>
              <div className={pillClass(s.status)}>{String(s.status || "UNKNOWN").toUpperCase()}</div>
            </div>

            <div className="row">
              <div className="metaLabel">Latencia</div>
              <div className="metaValue">{typeof s.latencyMs === "number" ? `${s.latencyMs} ms` : "—"}</div>
            </div>

            <div className="row">
              <div className="metaLabel">Último check</div>
              <div className="metaValue">{data?.generatedAt ? formatDateCR(data.generatedAt) : "—"}</div>
            </div>

            {s.url ? (
              <div style={{ marginTop: 10 }}>
                <div className="metaLabel">Endpoint</div>
                <div className="metaValue">
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                    {s.url}
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
