// 👇 請換成你最新部署的 GAS 網址！
const API_URL = "https://script.google.com/macros/s/AKfycbz2gLosc1uEWbVicvbHwcs7rj5jy5eomGwbEukgNS76y4uJELwE95-lLnEr8zXiBNgY/exec"; 

async function searchOrders() {
  const communityInput = document.getElementById('communityInput').value.trim();
  const codeInput = document.getElementById('searchInput').value.trim();
  
  if (!communityInput || !codeInput) {
    alert("請完整輸入「社群名稱」與「手機末六碼」！");
    return;
  }

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('resultContainer').classList.add('hidden');
  document.getElementById('orderList').innerHTML = '';

  try {
    const queryUrl = `${API_URL}?action=searchOrder&community=${encodeURIComponent(communityInput)}&code=${encodeURIComponent(codeInput)}`;
    const response = await fetch(queryUrl);
    const data = await response.json();

    document.getElementById('loading').classList.add('hidden');

    if (data.length === 0) {
      alert("查無訂單！請確認「社群名稱」或「手機末六碼」是否輸入正確。");
      return;
    }

    renderResults(data);

  } catch (error) {
    console.error("查詢失敗:", error);
    alert("系統發生錯誤，請稍後再試。");
    document.getElementById('loading').classList.add('hidden');
  }
}

function renderResults(orders) {
  let unpaidSum = 0;
  let paidSum = 0;
  const orderListDiv = document.getElementById('orderList');

  // 用來把同一個團的金額加總，判斷有沒有過廠商門檻
  const groups = {}; 

  orders.forEach(order => {
    const amount = parseInt(order['金額']) || 0;
    const groupName = order['團名'];
    const threshold = parseInt(order['廠商免運門檻']) || 999999;

    // 計算總帳
    if (order['結帳狀態'] === '未結帳') unpaidSum += amount;
    else if (order['結帳狀態'] === '已結帳') paidSum += amount;

    // 分組統計金額
    if (!groups[groupName]) {
      groups[groupName] = { totalAmount: 0, threshold: threshold };
    }
    groups[groupName].totalAmount += amount;

    // 畫出單筆明細卡片
    const paymentBadgeClass = order['結帳狀態'] === '未結帳' ? 'badge-unpaid' : 'badge-paid';
    const statusBadgeClass = order['到貨狀態'].includes('已') ? 'badge-arrived' : 'badge-progress';
    const cardHtml = `
      <div class="order-item">
        <div class="order-header">
          <span>${groupName}</span>
          <span class="badge ${statusBadgeClass}">${order['到貨狀態']}</span>
        </div>
        <div class="order-title">${order['品名']} x ${order['數量']}</div>
        <div class="order-details">
          <span>$${amount}</span>
          <span class="badge ${paymentBadgeClass}">${order['結帳狀態']}</span>
        </div>
      </div>
    `;
    orderListDiv.innerHTML += cardHtml;
  });

  document.getElementById('unpaidTotal').innerText = `$${unpaidSum}`;
  document.getElementById('paidTotal').innerText = `$${paidSum}`;

  // ======== 運費判斷邏輯 ========
  let combinedPoolAmount = 0; // 需要由你湊單出貨的總額
  let noticeHtml = "";

  for (let group in groups) {
    if (groups[group].totalAmount >= groups[group].threshold) {
      // 達到廠商門檻 -> 廠商直發
      noticeHtml += `<p style="color:#276749; margin:4px 0;">✅ <b>${group}</b>：滿額 $${groups[group].totalAmount}，由廠商直接免運寄出！</p>`;
    } else {
      // 未達廠商門檻 -> 丟進你的湊單池
      combinedPoolAmount += groups[group].totalAmount;
    }
  }

  // 判斷你的湊單池運費
  if (combinedPoolAmount > 0) {
    noticeHtml += `<hr style="border-top: 1px dashed #cbd5e0; margin: 12px 0;">`;
    if (combinedPoolAmount >= 2000) {
      noticeHtml += `<p style="color:#276749; margin:4px 0;">🎉 <b>合併湊單總額 $${combinedPoolAmount}</b><br>✅ 已達超商與宅配雙重免運！</p>`;
    } else if (combinedPoolAmount >= 1500) {
      noticeHtml += `<p style="color:#2b6cb0; margin:4px 0;">🎉 <b>合併湊單總額 $${combinedPoolAmount}</b>，已達超商免運！<br>💡 若需宅配運費 $80（差 $${2000 - combinedPoolAmount} 宅配免運）</p>`;
    } else {
      noticeHtml += `<p style="color:#666; margin:4px 0;">💡 <b>合併湊單總額 $${combinedPoolAmount}</b><br>📦 超商運費 $38（差 $${1500 - combinedPoolAmount} 湊免運）<br>🚚 宅配運費 $80（差 $${2000 - combinedPoolAmount} 湊免運）</p>`;
    }
  }

  document.getElementById('shippingNotice').innerHTML = noticeHtml;
  document.getElementById('resultContainer').classList.remove('hidden');
}
