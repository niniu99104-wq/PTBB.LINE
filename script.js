// 👇 務必換成你的 GAS 網址！
const API_URL = "https://script.google.com/macros/s/AKfycbxlSeK-dB_i9pMIO4g5qdOtyYgAFWS70kPcS8Zvmwiw6NrZtuCaU5nCAnBUq-SuWaEzMA/exec"; 

function toggleRegister() {
  const box = document.getElementById('registerBox');
  box.classList.toggle('hidden');
}

async function submitRegister() {
  const c = document.getElementById('regCommunity').value.trim();
  const p = document.getElementById('regPhone').value.trim();
  const n = document.getElementById('regName').value.trim();
  if (!c || !p) { alert("社群名稱與手機必填！"); return; }
  document.getElementById('loading').classList.remove('hidden');
  try {
    const url = `${API_URL}?action=register&community=${encodeURIComponent(c)}&phone=${encodeURIComponent(p)}&name=${encodeURIComponent(n)}`;
    const res = await fetch(url);
    const result = await res.json();
    document.getElementById('loading').classList.add('hidden');
    alert(result.message);
    if (result.success) {
      document.getElementById('communityInput').value = c;
      document.getElementById('searchInput').value = p;
      toggleRegister();
    }
  } catch (e) { alert("連線錯誤！"); document.getElementById('loading').classList.add('hidden'); }
}

async function searchOrders() {
  const c = document.getElementById('communityInput').value.trim();
  const p = document.getElementById('searchInput').value.trim();
  if (!c || !p) { alert("請輸入查詢資料！"); return; }
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('resultContainer').classList.add('hidden');
  try {
    const url = `${API_URL}?action=searchOrder&community=${encodeURIComponent(c)}&code=${encodeURIComponent(p)}`;
    const res = await fetch(url);
    const data = await res.json();
    document.getElementById('loading').classList.add('hidden');
    if (data.length === 0) { alert("查無資料，請確認是否註冊或輸入正確。"); return; }
    renderResults(data);
  } catch (e) { alert("系統錯誤！"); document.getElementById('loading').classList.add('hidden'); }
}

function renderResults(orders) {
  let unpaid = 0, paid = 0, pool = 0;
  let noticeHtml = "";
  const listDiv = document.getElementById('orderList');
  const groups = {};
  
  // 第一階段：計算總金額，並合併相同品項
  const mergedItems = {}; 
  
  listDiv.innerHTML = '';

  orders.forEach(o => {
    const amt = parseInt(o['金額']) || 0;
    const qty = parseInt(o['數量']) || 1; 
    const gName = o['團名'];
    const iName = o['品名'];
    const pStatus = o['結帳狀態'];
    const sStatus = o['到貨狀態'];
    const thr = parseInt(o['廠商免運門檻']) || 999999;

    if (pStatus === '未結帳') unpaid += amt; else paid += amt;
    
    if (!groups[gName]) groups[gName] = { total: 0, thr: thr };
    groups[gName].total += amt;

    const itemKey = `${gName}_${iName}_${pStatus}_${sStatus}`;
    
    if (!mergedItems[itemKey]) {
      mergedItems[itemKey] = {
        groupName: gName,
        itemName: iName,
        qty: qty,
        amount: amt,
        pStatus: pStatus,
        sStatus: sStatus
      };
    } else {
      mergedItems[itemKey].qty += qty;
      mergedItems[itemKey].amount += amt;
    }
  });

  // 第二階段：將合併後的項目「按團名」分類
  const categorizedItems = {};
  Object.values(mergedItems).forEach(item => {
    if (!categorizedItems[item.groupName]) {
      categorizedItems[item.groupName] = [];
    }
    categorizedItems[item.groupName].push(item);
  });

  // 第三階段：畫出畫面 (大團名 -> 底下明細)
  for (let gName in categorizedItems) {
    let groupHtml = `<div class="group-section">`;
    groupHtml += `<div class="group-title">${gName}</div>`; // 團名大標題
    
    categorizedItems[gName].forEach(item => {
      const pBadge = item.pStatus === '未結帳' ? 'badge-unpaid' : 'badge-paid';
      const sBadge = item.sStatus.includes('已') ? 'badge-arrived' : 'badge-progress';
      
      groupHtml += `
        <div class="order-item">
          <div class="order-title">${item.itemName} x ${item.qty}</div>
          <div class="order-details">
            <span>$${item.amount}</span>
            <div>
              <span class="badge ${sBadge}">${item.sStatus}</span>
              <span class="badge ${pBadge}">${item.pStatus}</span>
            </div>
          </div>
        </div>`;
    });
    groupHtml += `</div>`;
    listDiv.innerHTML += groupHtml;
  }

  // 更新金額顯示
  document.getElementById('unpaidTotal').innerText = `$${unpaid}`;
  document.getElementById('paidTotal').innerText = `$${paid}`;

  // 計算運費提示 (完全依照你的排版要求)
  for (let g in groups) {
    if (groups[g].total >= groups[g].thr) {
      noticeHtml += `<div>✅ ${g}：滿額廠商直寄！</div>`;
    } else {
      pool += groups[g].total;
    }
  }
  
  if (pool > 0) {
    if (pool >= 2000) {
      noticeHtml += `<div>🎉 湊單 $${pool}：雙重免運！</div>`;
    } else if (pool >= 1500) {
      noticeHtml += `<div>🎉 湊單 $${pool}：已達超商免運！(差$${2000-pool}可宅配免運)</div>`;
    } else {
      noticeHtml += `<div>💡 湊單 $${pool}：超商運費$38 (差$${1500-pool}) / 宅配$80 (差$${2000-pool})</div>`;
    }
  }
  
  document.getElementById('shippingNotice').innerHTML = noticeHtml;
  document.getElementById('resultContainer').classList.remove('hidden');
}
