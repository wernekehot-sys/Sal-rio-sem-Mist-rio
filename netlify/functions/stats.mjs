import { getStore } from "@netlify/blobs";

const corsHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (!["GET", "POST"].includes(request.method)) {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const store = getStore("salario-sem-misterio-stats");
    const stats = (await store.get("totals", { type: "json" })) || {
      views: 0,
      clicks: 0,
      updatedAt: null
    };

    if (request.method === "GET") {
      return jsonResponse(stats);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "JSON inválido." }, 400);
    }

    if (body.action === "view") {
      stats.views = Number(stats.views || 0) + 1;
    } else if (body.action === "click") {
      stats.clicks = Number(stats.clicks || 0) + 1;
    } else {
      return jsonResponse({ error: "Ação inválida." }, 400);
    }

    stats.updatedAt = new Date().toISOString();
    await store.setJSON("totals", stats);
    return jsonResponse(stats);
  } catch (error) {
    console.error("Erro nas estatísticas do e-book:", error);
    return jsonResponse({
      error: "Estatísticas indisponíveis. Verifique a configuração do Netlify Blobs."
    }, 500);
  }
};
