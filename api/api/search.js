// Search Yahoo's free, unofficial catalogue and return NSE equities only.
const SYMBOL = /^[A-Z0-9][A-Z0-9&-]{0,19}\.NS$/;
module.exports = async (req,res) => {
 res.setHeader('Cache-Control','public, s-maxage=90, stale-while-revalidate=180');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const q=typeof req.query.q==='string'?req.query.q.trim():'';
 if(q.length<2 || q.length>60) return res.status(400).json({error:'Enter at least 2 characters'});
 for(const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com']) {
  try {
   const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),7000);
   let response;try {response=await fetch(`https://${host}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=50&newsCount=0`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:controller.signal})}finally{clearTimeout(timeout)}
   if(!response.ok){if(response.status===429)continue;throw Error(`Search source HTTP ${response.status}`)}
   const json=await response.json(),seen=new Set();
   const results=(json.quotes||[]).filter(x=>x.quoteType==='EQUITY'&&x.exchange==='NSI'&&SYMBOL.test(x.symbol)).map(x=>({symbol:x.symbol,name:x.longname||x.shortname||x.symbol})).filter(x=>!seen.has(x.symbol)&&seen.add(x.symbol)).slice(0,15);
   return res.status(200).json({results});
  }catch(e){if(host==='query2.finance.yahoo.com')return res.status(502).json({error:'Stock search temporarily unavailable'})}
 }
 return res.status(502).json({error:'Stock search temporarily unavailable'});
};
