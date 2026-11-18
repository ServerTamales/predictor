// Intermediario para que Predictor Kalshi lea los mercados públicos de 15 min.
// Solo lee datos públicos de Kalshi: no usa cuentas, claves ni órdenes.
//   ?series=KXBTC15M          -> mercados abiertos de la serie (objetivo y precios)
//   ?ticker=KXBTC15M-...      -> un mercado (para saber el resultado al cierre)
const ORIGINS = ['https://servertamales.github.io'];
const SERIES = new Set(['KXBTC15M', 'KXETH15M', 'KXSOL15M']);
const TICKER = /^KX(BTC|ETH|SOL)15M-[0-9A-Z-]{4,40}$/;
const API = 'https://api.elections.kalshi.com/trade-api/v2';

export default {
  async fetch(req) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    };
    const json = (body, status) => new Response(body, {
      status, headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'GET') return json('{"error":"solo GET"}', 405);

    const q = new URL(req.url).searchParams;
    let url;
    if (SERIES.has(q.get('series'))) {
      url = API + '/markets?status=open&limit=20&series_ticker=' + q.get('series');
    } else if (TICKER.test(q.get('ticker') || '')) {
      url = API + '/markets/' + q.get('ticker');
    } else {
      return json('{"error":"pide series=KXBTC15M|KXETH15M|KXSOL15M o ticker=..."}', 400);
    }
    const r = await fetch(url, { headers: { accept: 'application/json' }, cf: { cacheTtl: 1, cacheEverything: true } });
    return json(await r.text(), r.status);
  },
};
