// ====== 本地儲存的 key 名稱 ======
const LS = {
  url: 'INVEST_API_URL',
  key: 'INVEST_API_KEY'
};

// ✅ 先放預設值（你也可以稍後在「設定」頁貼上覆蓋）
if (!localStorage.getItem(LS.url))  localStorage.setItem(LS.url,  'https://script.google.com/macros/s/REPLACE/exec'); // ← 換成你的 /exec
if (!localStorage.getItem(LS.key))  localStorage.setItem(LS.key,  'kP4xVn7tQ9aR2wS8dJ6mF0bB3uL5zC1'); // ← 我幫你生的 API_KEY

const $ = s => document.querySelector(s);
const fmt  = n => (isNaN(n) ? '—' : Number(n).toLocaleString('zh-TW', {maximumFractionDigits: 0}));
const fmt2 = n => (isNaN(n) ? '—' : Number(n).toLocaleString('zh-TW', {maximumFractionDigits: 2}));

// ====== 分頁切換 ======
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById(t.dataset.to).classList.add('active');
    if (t.dataset.to==='dash') loadDashboard();
    if (t.dataset.to==='trades') loadTrades();
    if (t.dataset.to==='positions') loadPositions();
    if (t.dataset.to==='settings') loadSettings();
  };
});

function cfg(){ return { url: localStorage.getItem(LS.url), key: localStorage.getItem(LS.key) }; }
async function apiGet(action){
  const {url,key} = cfg();
  const u = `${url}?action=${encodeURIComponent(action)}&x-api-key=${encodeURIComponent(key)}`;
  const r = await fetch(u); return await r.json();
}
async function apiPost(action, body){
  const {url,key} = cfg();
  const r = await fetch(`${url}?action=${action}`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ xApiKey: key, ...body })
  }); return await r.json();
}

// ====== 儀表板 ======
async function loadDashboard(){
  try{
    const d = await apiGet('dashboard');
    $('#totalValue').textContent = fmt(d.totalValueTWD);
    $('#invested').textContent   = fmt(d.investedTWD);
    $('#pnl').textContent        = fmt(d.totalPnLTWD);
    $('#target').textContent     = fmt(d.progressTargetTWD);
    $('#now').textContent        = fmt(d.progressNowTWD);
    $('#rate').textContent       = `${Math.round((d.progressRate||0)*100)}%`;
    $('#leadlag').textContent    = fmt(d.leadLagTWD);
    $('#mBuy').textContent       = fmt2(d.thisMonthInvestUSD);
    $('#mSell').textContent      = fmt2(d.thisMonthSellUSD);
    $('#mDiv').textContent       = fmt2(d.thisMonthDivUSD);
    $('#fg').textContent         = isNaN(d.fearGreed) ? '—' : Math.round(d.fearGreed);
    $('#fgNote').textContent     = adviceFG(d.fearGreed||0);
  }catch(e){ console.error(e); }
}
function adviceFG(fg){
  if (fg<25) return '極度恐慌：強化定投 / 逢低買';
  if (fg<50) return '恐慌：按計畫定投';
  if (fg<75) return '貪婪：減緩加碼';
  return '極度貪婪：暫停加碼 / 降槓桿';
}

// ====== 交易 ======
$('#btnAdd').onclick = async ()=>{
  const body = {
    date: $('#tDate').value || new Date().toISOString().slice(0,10),
    ticker: $('#tTicker').value.trim().toUpperCase(),
    side: $('#tSide').value,
    qty: +$('#tQty').value || 0,
    price: +$('#tPrice').value || 0,
    fee: +$('#tFee').value || 0,
    fx: +$('#tFx').value || 0,
    note: $('#tNote').value.trim()
  };
  $('#addMsg').textContent = '送出中…';
  try{
    const r = await apiPost('addtrade', { body });
    if (r.ok){ $('#addMsg').textContent = '已儲存 ✔'; loadTrades(); }
    else     { $('#addMsg').textContent = '失敗：' + (r.error||''); }
  }catch(e){ $('#addMsg').textContent = '失敗：' + e; }
};

async function loadTrades(){
  const box = $('#tradesList'); box.textContent = '載入中…';
  try{
    const r = await apiGet('trades');
    box.innerHTML = r.items.slice(-50).reverse().map(t=>(
      `<div class="row"><div>${t.date}・${t.ticker}</div><div>${t.side}</div></div>
       <div style="font-size:12px;color:#666;margin-bottom:6px">qty ${t.qty} @ ${t.price} fee ${t.fee} fx ${t.fx} ${(t.note||'')}</div>`
    )).join('');
  }catch(e){ box.textContent = '讀取失敗'; }
}

// ====== 持倉 ======
async function loadPositions(){
  const box = $('#posList'); box.textContent = '載入中…';
  try{
    const r = await apiGet('positions');
    box.innerHTML = r.items.map(p=>(
      `<div class="row"><div>${p.ticker}・x${p.qty}</div>
        <div class="${p.uPnL>=0?'posUp':'posDn'}">${p.uPnL.toFixed(2)}</div></div>
       <div style="font-size:12px;color:#666;margin-bottom:6px">avg ${p.avg.toFixed(2)} → last ${p.last.toFixed(2)}｜市值 ${p.mkt.toFixed(2)}</div>`
    )).join('');
  }catch(e){ box.textContent = '讀取失敗'; }
}

// ====== 設定 ======
function loadSettings(){
  $('#apiUrl').value = localStorage.getItem(LS.url) || '';
  $('#apiKey').value = localStorage.getItem(LS.key) || '';
}
$('#btnSaveCfg').onclick = ()=>{
  localStorage.setItem(LS.url, $('#apiUrl').value.trim());
  localStorage.setItem(LS.key, $('#apiKey').value.trim());
  $('#cfgMsg').textContent = '已儲存 ✅';
};

// 首頁先載一次
loadDashboard();
