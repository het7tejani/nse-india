// Best-effort sector lookup from Yahoo search metadata. Unknown is shown honestly.
const SYMBOL=/^[A-Z0-9][A-Z0-9&-]{0,19}\.NS$/;
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const input=typeof req.query.symbols==='string'?req.query.symbols:'';
 const symbols=[...new Set(input.toUpperCase().split(',').map(s=>s.trim()).filter(Boolean))];
 if(!symbols.length||symbols.length>25||symbols.some(s=>!SYMBOL.test(s)))return res.status(400).json({error:'Enter 1-25 NSE symbols'});
 const results=await Promise.all(symbols.map(async symbol=>{
  for(const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
   try{
    const response=await fetch(`https://${host}/v1/finance/search?q=${encodeURIComponent(symbol.replace(/\.NS$/,''))}&quotesCount=20&newsCount=0`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:controller.signal});
    if(!response.ok)continue;
    const body=await response.json(),match=body.quotes?.find(x=>x.symbol===symbol&&x.exchange==='NSI'&&x.quoteType==='EQUITY');
    if(match)return {symbol,sector:match.sector||'Unclassified'};
   }catch{}finally{clearTimeout(timer)}
  }
  return {symbol,sector:'Unclassified'};
 }));
 res.status(200).json({results});
};
