// 👇 請將下面引號內的網址，換成你 GAS 重新部署後的新網址！
const API_URL = "https://script.google.com/macros/s/AKfycbxc5syf5Zwq5ApTy4evYT0gLkRISRJfZY8ysaS6BGr_cJKyu9spzKSNA70v8qdGkhqZHw/exec"; 

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

  orders.forEach(order => {
    const amount = parseInt(order['金額']) || 0;
    if (order['結帳狀態'] === '未結帳') {
      unpaidSum += amount;
    } else if (order['結帳狀態'] === '已結帳') {
      paidSum += amount;
    }

    const paymentBadgeClass = order['結帳狀態'] === '未結帳' ? 'badge-unpaid' : 'badge-paid';
    const statusBadgeClass = order['到貨狀態'].includes('已') ? 'badge-arrived' : 'badge-progress';

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

  document.getElementById('unpaidTotal').innerText = `$${unpaidSum}`;
  document.getElementById('paidTotal').innerText = `$${paidSum}`;

  const totalAmount = unpaidSum + paidSum;
  const noticeDiv = document.getElementById('shippingNotice');
  if (totalAmount >= 1000) {
    noticeDiv.innerText = "🎉 您的總金額已達免運門檻！";
    noticeDiv.style.color = "#276749";
  } else {
    noticeDiv.innerText = `💡 累計總額 $${totalAmount}，還差 $${1500 - totalAmount} 即可湊超商免運。`;
    noticeDiv.innerText = `💡 累計總額 $${totalAmount}，還差 $${2000 - totalAmount} 即可湊宅配免運。`;
    noticeDiv.style.color = "#666";
  }

  document.getElementById('resultContainer').classList.remove('hidden');
}
