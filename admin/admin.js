(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Mirrors worker/lib/wallets.js -- used only to pre-fill a sensible starting
  // point in the payment-details textarea; the merchant can edit or replace it.
  var WALLETS = {
    'usdt-eth': { label: 'USDT (ERC-20)', addr: '0x2629c24d3720E5A24adBe7Bde4677334B559C36D' },
    'usdt-trx': { label: 'USDT (TRC-20)', addr: 'TVQGzSJKcHXTwX6Fn8CPb6A5PmAkoCFZRh' },
    'btc':      { label: 'Bitcoin (BTC)', addr: 'bc1qdhgnlpctw37vg825eejkknurpm23a5lsthfdhg' },
    'eth':      { label: 'Ethereum (ETH)', addr: '0x2629c24d3720E5A24adBe7Bde4677334B559C36D' },
    'sol':      { label: 'Solana (SOL)', addr: 'GdNUybxyu8cBY7snHAZsdopH6WKdHBVXo5d79mR9PhJ' },
    'xrp':      { label: 'XRP', addr: 'rBiWxdA3a27BXYC9ZwQRTyFdXNWaEjLfBr' },
    'bnb':      { label: 'BNB (BSC)', addr: '0x2629c24d3720E5A24adBe7Bde4677334B559C36D' },
  };

  function defaultPaymentText(o) {
    var method = (o.payment || '').toUpperCase();
    if (method === 'CRYPTO') {
      var w = WALLETS[o.wallet_key] || WALLETS['usdt-eth'];
      return w.label + ' address: ' + w.addr + '\nPlease include order ref ' + o.ref + ' in the transaction memo.';
    }
    if (method === 'PAYPAL') return 'PayPal: send to [your PayPal.me link or email]. Reference order ' + o.ref + '.';
    if (method === 'APPLEPAY') return 'Apple Pay: [payment link]. Reference order ' + o.ref + '.';
    return 'Chime / Zelle: [recipient name / handle]. Reference order ' + o.ref + '.';
  }

  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('login-err');
      errEl.hidden = true;
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
        }),
        credentials: 'same-origin',
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data.success) {
            window.location.href = '/admin/dashboard.html';
          } else {
            errEl.textContent = (res.data && res.data.error) || 'Login failed';
            errEl.hidden = false;
          }
        })
        .catch(function () {
          errEl.textContent = 'Network error';
          errEl.hidden = false;
        });
    });
  }

  var ordersList = document.getElementById('orders-list');
  if (ordersList) {
    var logoutBtn = document.getElementById('logout-btn');
    var modal = document.getElementById('order-modal');
    var modalBody = document.getElementById('modal-body');
    var modalClose = document.getElementById('modal-close');
    var orders = [];

    function fmtDate(iso) {
      try { return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; }
    }

    function renderList() {
      if (!orders.length) {
        ordersList.innerHTML = '<p style="color:#6b6b6b">No orders yet.</p>';
        return;
      }
      ordersList.innerHTML = orders.map(function (o) {
        return '<div class="order-row" data-id="' + o.id + '">' +
          '<div><div class="ref">' + esc(o.ref) + '</div><div class="name">' + esc(o.name) + ' &middot; ' + fmtDate(o.created_at) + '</div></div>' +
          '<span class="status-pill ' + esc(o.status) + '">' + esc(o.status) + '</span>' +
          '<div class="total">' + esc(o.total) + '</div>' +
          '</div>';
      }).join('');
      Array.prototype.forEach.call(ordersList.querySelectorAll('.order-row'), function (row) {
        row.addEventListener('click', function () { openModal(Number(row.dataset.id)); });
      });
    }

    function loadOrders() {
      fetch('/api/admin/orders', { credentials: 'same-origin' })
        .then(function (r) {
          if (r.status === 401) { window.location.href = '/admin/'; return null; }
          return r.json();
        })
        .then(function (data) {
          if (!data) return;
          orders = data.orders || [];
          renderList();
        })
        .catch(function () {
          ordersList.innerHTML = '<p style="color:#b91c1c">Failed to load orders.</p>';
        });
    }

    function itemsRows(itemsStr) {
      return esc(itemsStr).split(' | ').filter(Boolean).map(function (line) {
        return '<div style="padding:4px 0;border-bottom:1px solid #eee;font-size:13px">' + line + '</div>';
      }).join('');
    }

    function paymentSection(o) {
      if (o.status === 'new') {
        return '<label style="display:block;font-size:12px;color:#6b6b6b;margin:16px 0 4px">Payment details to send with the invoice</label>' +
          '<textarea id="payment-details-input" rows="4" style="width:100%;padding:10px;border-radius:8px;border:1px solid #e8e0d4;font-family:inherit;font-size:13px;box-sizing:border-box">' + esc(defaultPaymentText(o)) + '</textarea>';
      }
      if (o.payment_details) {
        return '<label style="display:block;font-size:12px;color:#6b6b6b;margin:16px 0 4px">Payment details sent</label>' +
          '<div style="white-space:pre-wrap;font-size:13px;background:#faf8f5;border:1px solid #e8e0d4;border-radius:8px;padding:10px">' + esc(o.payment_details) + '</div>';
      }
      return '';
    }

    function openModal(id) {
      var o = orders.filter(function (x) { return x.id === id; })[0];
      if (!o) return;
      modalBody.innerHTML =
        '<h2>' + esc(o.ref) + ' <span class="status-pill ' + esc(o.status) + '">' + esc(o.status) + '</span></h2>' +
        '<table>' +
        '<tr><td>Customer</td><td>' + esc(o.name) + '</td></tr>' +
        '<tr><td>Email</td><td>' + esc(o.email) + '</td></tr>' +
        '<tr><td>Phone</td><td>' + esc(o.phone) + '</td></tr>' +
        '<tr><td>Address</td><td>' + esc(o.address) + '</td></tr>' +
        '<tr><td>Payment</td><td>' + esc(o.payment) + '</td></tr>' +
        '</table>' +
        itemsRows(o.items) +
        '<table style="margin-top:12px">' +
        '<tr><td>Subtotal</td><td>' + esc(o.subtotal) + '</td></tr>' +
        '<tr><td>Discount</td><td>' + esc(o.discount) + '</td></tr>' +
        '<tr><td><strong>Total</strong></td><td><strong>' + esc(o.total) + '</strong></td></tr>' +
        '</table>' +
        paymentSection(o) +
        '<div class="modal-actions">' +
        '<button class="btn-invoice" id="dispatch-invoice-btn"' + (o.status !== 'new' ? ' disabled' : '') + '>' + (o.status === 'new' ? 'Send Invoice' : 'Invoice Sent') + '</button>' +
        '<button class="btn-paid" id="mark-paid-btn"' + (o.status === 'paid' ? ' disabled' : '') + '>' + (o.status === 'paid' ? 'Paid' : 'Mark as Paid') + '</button>' +
        '</div>';

      var invoiceBtn = document.getElementById('dispatch-invoice-btn');
      if (invoiceBtn) {
        invoiceBtn.addEventListener('click', function () {
          var input = document.getElementById('payment-details-input');
          runAction(o.id, 'invoice', invoiceBtn, { paymentDetails: input ? input.value : '' });
        });
      }
      var paidBtn = document.getElementById('mark-paid-btn');
      if (paidBtn) paidBtn.addEventListener('click', function () { runAction(o.id, 'paid', paidBtn); });

      modal.hidden = false;
    }

    function runAction(id, action, btn, body) {
      btn.disabled = true;
      btn.textContent = 'Working…';
      fetch('/api/admin/orders/' + id + '/' + action, {
        method: 'POST',
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            loadOrders();
            modal.hidden = true;
          } else {
            btn.disabled = false;
            btn.textContent = 'Failed — retry';
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Failed — retry';
        });
    }

    modalClose.addEventListener('click', function () { modal.hidden = true; });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.hidden = true; });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }).then(function () {
          window.location.href = '/admin/';
        });
      });
    }

    loadOrders();
  }
})();
