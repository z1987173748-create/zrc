(function () {
  function normalizeBaseUrl(value) {
    if (!value) {
      const current = window.location.href.replace(/\/[^/]*$/, '/');
      return current;
    }
    return value.endsWith('/') ? value : `${value}/`;
  }

  function buildQrUrl(targetUrl) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(targetUrl)}`;
  }

  function updateShareCards() {
    const baseUrl = normalizeBaseUrl(document.getElementById('base-url-input').value.trim());
    const customerUrl = new URL('index.html', baseUrl).toString();
    const merchantUrl = new URL('merchant.html', baseUrl).toString();

    const customerLink = document.getElementById('customer-link');
    const merchantLink = document.getElementById('merchant-link');
    const customerQr = document.getElementById('customer-qr');
    const merchantQr = document.getElementById('merchant-qr');

    customerLink.href = customerUrl;
    customerLink.textContent = customerUrl;
    merchantLink.href = merchantUrl;
    merchantLink.textContent = merchantUrl;
    customerQr.src = buildQrUrl(customerUrl);
    merchantQr.src = buildQrUrl(merchantUrl);
  }

  async function copyLink(anchorId) {
    const href = document.getElementById(anchorId).href;
    await navigator.clipboard.writeText(href);
    window.alert('链接已复制。');
  }

  function init() {
    document.getElementById('base-url-input').value = normalizeBaseUrl('');
    updateShareCards();

    document.getElementById('apply-base-url').addEventListener('click', updateShareCards);
    document.querySelectorAll('.copy-button').forEach((button) => {
      button.addEventListener('click', () => copyLink(button.dataset.target));
    });
  }

  init();
})();
