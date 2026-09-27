// Vercel serverless proxy for NSE quotes. Yahoo's chart endpoint is unofficial.
const cache = new Map();
const TTL = 60_000;
const STALE = 15 * 60_000;
const MAX_SYMBOLS = 25;
const SYMBOL = /^[A-Z0-9][A-Z0-9&-]{0,19}(\.NS)?$/;

async function quote(symbol) {
  const key = symbol.endsWith('.NS') ? symbol : symbol + '.NS';
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL) return { ...cached.value, cached: true };
  try {
    let response;
    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        response = await fetch(`https://${host}/v8/finance/chart/${encodeURIComponent(key)}?interval=1d&range=5d`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NSEPortfolio/1.0)', Accept: 'application/json' },
          signal: controller.signal
        });
        if (response.ok) break;
        if (response.status !== 429 || host.startsWith('query2')) throw new Error(`Price source HTTP ${response.status}`);
      } finally { clearTimeout(timeout); }
    }
    if (!response?.ok) throw new Error('Yahoo price source unavailable');
    const json = await response.json();
    const chart = json?.chart?.result?.[0];
    const meta = chart?.meta;
    if (!meta || !Number.isFinite(meta.regularMarketPrice) || meta.currency !== 'INR' || !['NSI', 'NSE'].includes(meta.exchangeName)) throw new Error('NSE price unavailable or symbol invalid');
    const candles = (chart?.indicators?.quote?.[0]?.close || []).filter(Number.isFinite);
    const previousClose = Number.isFinite(meta.previousClose) ? meta.previousClose : candles.length >= 2 ? candles[candles.length - 2] : null;
    const value = {
      symbol, resolvedSymbol: key, name: meta.longName || meta.shortName || symbol, price: meta.regularMarketPrice,
      previousClose: Number.isFinite(previousClose) && previousClose > 0 ? previousClose : null,
      asOf: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
      currency: 'INR', source: 'Yahoo Finance', delayed: true
    };
    cache.set(key, { value, at: Date.now() });
    return value;
  } catch (error) {
    if (cached && Date.now() - cached.at < STALE) return { ...cached.value, cached: true, stale: true, warning: error.message };
    return { symbol, error: error.message || 'Price unavailable' };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const input = typeof req.query.symbols === 'string' ? req.query.symbols : '';
  const symbols = [...new Set(input.toUpperCase().split(',').map(s => s.trim()).filter(Boolean))];
  if (!symbols.length || symbols.length > MAX_SYMBOLS || symbols.some(s => !SYMBOL.test(s))) return res.status(400).json({ error: `Enter 1-${MAX_SYMBOLS} valid NSE symbols` });
  const quotes = await Promise.all(symbols.map(quote));
  return res.status(200).json({ quotes, fetchedAt: new Date().toISOString() });
};
