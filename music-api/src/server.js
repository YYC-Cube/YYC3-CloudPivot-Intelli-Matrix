/**
 * YYC³ Music API
 * ==============
 * - 读: NAS 5433 流复制备库 (只读)
 * - 写: Mac 5433 主库 (经 Tailscale, 不可达时 503 优雅降级)
 * - 媒体: 本地挂载的 NAS 音乐目录, 支持 HTTP Range (拖动进度条)
 */
const Fastify = require("fastify");
const { Pool } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3113);
const HOST = process.env.HOST || "0.0.0.0";
const MUSIC_ROOT = process.env.MUSIC_ROOT || "/music";
const READ_URL =
  process.env.DATABASE_READ_URL ||
  "postgres://yanyu@192.168.3.45:5433/yyc3_music";
const WRITE_URL =
  process.env.DATABASE_WRITE_URL ||
  "postgres://yanyu@100.87.159.21:5433/yyc3_music";
const CORS_ORIGINS = (
  process.env.CORS_ORIGINS ||
  "http://localhost:3218,http://localhost:3118,https://yyc-cube.github.io"
).split(",");

/** file_path 历史前缀 -> 统一映射到 MUSIC_ROOT 下的相对路径 */
const PATH_PREFIXES = ["/Volumes/Max/Music/", "/Volume1/yyc3_hd/Music/"];

const MIME = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4",
};

const readPool = new Pool({ connectionString: READ_URL, max: 5 });
const writePool = new Pool({ connectionString: WRITE_URL, max: 2 });

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || "info" } });

// ── CORS（白名单） ──────────────────────────────
app.addHook("onRequest", (req, reply, done) => {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", origin);
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    reply.code(204).send();
    return;
  }
  done();
});

// ── 健康检查 ──────────────────────────────
async function healthHandler() {
  let db = "up";
  try {
    await readPool.query("SELECT 1");
  } catch {
    db = "down";
  }
  const mediaReady = fs.existsSync(MUSIC_ROOT);
  const status = db === "up" && mediaReady ? "ok" : "degraded";
  return { status, db, mediaReady, uptime: Math.round(process.uptime()) };
}
app.get("/healthz", healthHandler);
// 前端服务层以 /api/music 为基址，提供同路径别名（经 Vite 代理/反代时可用）
app.get("/api/music/healthz", healthHandler);

// ── 专辑列表 ──────────────────────────────
app.get("/api/music/albums", async () => {
  const { rows } = await readPool.query(
    `SELECT id, title, artist, track_count AS "trackCount",
            duration, cover
       FROM public.albums
      WHERE status = 'published'
      ORDER BY artist, title`
  );
  return { data: rows };
});

// ── 曲目列表（支持 album 过滤与关键字搜索） ──────────────────────────────
app.get("/api/music/tracks", async (req) => {
  const { album, q } = req.query;
  const conds = ["status = 'approved'"];
  const params = [];
  if (album) {
    params.push(album);
    conds.push(`album = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    conds.push(`(title ILIKE $${i} OR artist ILIKE $${i})`);
  }
  const { rows } = await readPool.query(
    `SELECT id, title, artist, album, duration,
            file_size AS "fileSize", format, play_count AS "playCount",
            cover, tags
       FROM public.musics
      WHERE ${conds.join(" AND ")}
      ORDER BY album, title
      LIMIT 500`,
    params
  );
  return { data: rows };
});

// ── 按 ID 流式播放（HTTP Range） ──────────────────────────────
app.get("/api/music/stream/:id", async (req, reply) => {
  const { rows } = await readPool.query(
    `SELECT file_path, title, format
       FROM public.musics
      WHERE id = $1 AND status = 'approved'`,
    [req.params.id]
  );
  if (!rows.length) return reply.code(404).send({ error: "track_not_found" });

  let rel = rows[0].file_path;
  for (const p of PATH_PREFIXES) {
    if (rel.startsWith(p)) {
      rel = rel.slice(p.length);
      break;
    }
  }
  // 防目录穿越：解析后必须仍位于 MUSIC_ROOT 内
  const abs = path.resolve(MUSIC_ROOT, rel);
  if (!abs.startsWith(path.resolve(MUSIC_ROOT) + path.sep)) {
    return reply.code(403).send({ error: "forbidden_path" });
  }
  if (!fs.existsSync(abs)) {
    return reply.code(404).send({ error: "media_missing", rel });
  }

  const stat = fs.statSync(abs);
  const mime = MIME[rows[0].format] || "application/octet-stream";
  reply.header("Content-Type", mime);
  reply.header("Accept-Ranges", "bytes");
  reply.header("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(rows[0].title)}.${rows[0].format || "mp3"}`);

  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (m) {
      const start = parseInt(m[1], 10);
      const end = m[2] ? Math.min(parseInt(m[2], 10), stat.size - 1) : stat.size - 1;
      if (start >= stat.size || start > end) {
        return reply.code(416).header("Content-Range", `bytes */${stat.size}`).send();
      }
      reply.code(206);
      reply.header("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      reply.header("Content-Length", end - start + 1);
      return reply.send(fs.createReadStream(abs, { start, end }));
    }
  }
  reply.header("Content-Length", stat.size);
  return reply.send(fs.createReadStream(abs));
});

// ── 播放计数（写转发主库） ──────────────────────────────
app.post("/api/music/tracks/:id/play", async (req, reply) => {
  try {
    const { rows } = await writePool.query(
      `UPDATE public.musics
          SET play_count = play_count + 1
        WHERE id = $1
        RETURNING play_count AS "playCount"`,
      [req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: "track_not_found" });
    return { data: rows[0] };
  } catch (err) {
    req.log.warn({ err }, "write-forward failed (primary unreachable)");
    return reply.code(503).send({ error: "write_unavailable" });
  }
});

// ── 启动 ──────────────────────────────
app
  .listen({ port: PORT, host: HOST })
  .then(() => {
    app.log.info(`music-api listening on ${HOST}:${PORT}, root=${MUSIC_ROOT}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
