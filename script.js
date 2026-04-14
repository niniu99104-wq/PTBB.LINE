// 👇 請將引號內的網址換成你剛才部署的 GAS 網頁應用程式 URL
const API_URL = "https://script.google.com/macros/s/AKfycbwb-ads5E3B5u15cAje0Yh3HaXHk2pPu7UjHeIocln4D4MkbDfbRfADK1xpihYXvMLcGQ/exec"; 

async function searchOrders() {
  const codeInput = document.getElementById('searchInput').value.trim();
  
  if (!codeInput) {
    alert("請輸入查詢代碼！");
    return;
  }

  // 切換 UI 狀態
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('resultContainer').classList.add('hidden');
  document.getElementById('orderList').innerHTML = '';

  try {
    // 呼叫你的 GAS API
    const response = await fetch(`${API_URL}?action=searchOrder&code=${codeInput}`);
    const data = await response.json();

    document.getElementById('loading').classList.add('hidden');

    if (data.length === 0) {
      alert("查無此代碼的訂單，請確認是否輸入正確。");
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

  orders.forEach(order => {
    // 1. 計算金額邏輯
    const amount = parseInt(order['金額']) || 0;
    if (order['結帳狀態'] === '未結帳') {
      unpaidSum += amount;
    } else if (order['結帳狀態'] === '已結帳') {
      paidSum += amount;
    }

    // 2. 判斷標籤顏色
    const paymentBadgeClass = order['結帳狀態'] === '未結帳' ? 'badge-unpaid' : 'badge-paid';
    // 簡單判斷到貨狀態給予不同顏色
    const statusBadgeClass = order['到貨狀態'].includes('已') ? 'badge-arrived' : 'badge-progress';

    // 3. 建立訂單卡片 HTML
    const cardHtml = `
      <div class="order-item">
        <div class="order-header">
          <span>${order['團名']}</span>
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

  // 4. 更新總額顯示
  document.getElementById('unpaidTotal').innerText = `$${unpaidSum}`;
  document.getElementById('paidTotal').innerText = `$${paidSum}`;

  // 5. 簡單的免運提示邏輯 (假設免運門檻為 1000)
  const totalAmount = unpaidSum + paidSum;
  const noticeDiv = document.getElementById('shippingNotice');
  if (totalAmount >= 1000) {
    noticeDiv.innerText = "🎉 您的總金額已達免運門檻！";
    noticeDiv.style.color = "#276749";
  } else {
    noticeDiv.innerText = `💡 累計總額 $${totalAmount}，還差 $${1000 - totalAmount} 即可湊免運。`;
    noticeDiv.style.color = "#666";
  }

  // 顯示結果區塊
  document.getElementById('resultContainer').classList.remove('hidden');
}
