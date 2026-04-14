// 👇 務必換成你最新部署的 GAS 網址！
const API_URL = "https://script.google.com/macros/s/AKfycbxlSeK-dB_i9pMIO4g5qdOtyYgAFWS70kPcS8Zvmwiw6NrZtuCaU5nCAnBUq-SuWaEzMA/exec"; 

// 控制註冊表單開關
function toggleRegister() {
  const box = document.getElementById('registerBox');
  box.classList.toggle('hidden');
}

// 處理註冊送出
async function submitRegister() {
  const community = document.getElementById('regCommunity').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const name = document.getElementById('regName').value.trim();

  if (!community || !phone) {
    alert("社群名稱與手機末六碼為必填項目！");
    return;
  }

  document.getElementById('loading').innerText = "資料建檔中，請稍候...";
  document.getElementById('loading').classList.remove('hidden');

  try {
    // 改用 GET 確保跨網域不會被擋，且能收到精準回覆
    const queryUrl = `${API_URL}?action=register&community=${encodeURIComponent(community)}&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`;
    const response = await fetch(queryUrl);
    const result = await response.json();

    document.getElementById('loading').classList.add('hidden');

    if (result.success) {
      alert(result.message);
      // 註冊成功後自動將資料填入查詢框
      document.getElementById('communityInput').value = community;
      document.getElementById('searchInput').value = phone;
      toggleRegister();
    } else {
      alert(result.message); // 顯示重複註冊等警告
    }

  } catch (error) {
    console.error("註冊失敗:", error);
    alert("系統發生連線錯誤，請稍後再試。");
    document.getElementById('loading').classList.add('hidden');
  }
}

// 處理訂單查詢
async function searchOrders() {
  const communityInput = document.getElementById('communityInput').value.trim();
  const codeInput = document.getElementById('searchInput').value.trim();
  
  if (!communityInput || !codeInput) {
    alert("請完整輸入「社群名稱」與「手機末六碼」！");
    return;
  }

  document.getElementById('loading').innerText = "資料撈取中，請稍候...";
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('resultContainer').classList.add('hidden');
  document.getElementById('orderList').innerHTML = '';

  try {
    const queryUrl = `${API_URL}?action=searchOrder&community=${encodeURIComponent(communityInput)}&code=${encodeURIComponent(codeInput)}`;
    const response = await fetch(queryUrl);
    const data = await response.json();

    document.getElementById('loading').classList.add('hidden');

    if (data.length === 0) {
      alert("查無訂單！請確認「社群名稱」或「手機末六碼」是否輸入正確，或確認是否已註冊。");
      return;
    }

    renderResults(data);

  } catch (error) {
    console.error("查詢失敗:", error);
    alert("系統發生錯誤，請稍後再試。");
    document.getElementById('loading').classList.add('hidden');
  }
}

// 渲染明細與運費門檻
function renderResults(orders) {
  let unpaidSum = 0;
  let paidSum = 0;
  const orderListDiv = document.getElementById('orderList');
  const groups = {}; 

  orders.forEach(order => {
    const amount = parseInt(order['金額']) || 0;
    const groupName = order['團名'];
    const threshold = parseInt(order['廠商免運門檻']) || 999999;

    if (order['結帳狀態'] === '未結帳') unpaidSum += amount;
    else if (order['結帳狀態'] === '已結帳') paidSum += amount;

    if (!groups[groupName]) {
      groups[groupName] = { totalAmount: 0, threshold: threshold };
    }
    groups[groupName].totalAmount += amount;

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

  let combinedPoolAmount = 0; 
  let noticeHtml = "";

  for (let group in groups) {
    if (groups[group].totalAmount >= groups[group].threshold) {
      noticeHtml += `<p style="color:#276749; margin:4px 0;">✅ <b>${group}</b>：滿額 $${groups[group].totalAmount}，<b>廠商直寄！</b></p>`;
    } else {
      combinedPoolAmount += groups[group].totalAmount;
    }
  }

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
