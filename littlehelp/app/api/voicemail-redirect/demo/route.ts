import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voicemail Redirect Demo - LittleHelp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .phone {
      width: 100%;
      max-width: 390px;
      background: #1e293b;
      border-radius: 40px;
      padding: 20px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
      border: 2px solid #334155;
    }
    .notch {
      width: 120px;
      height: 6px;
      background: #334155;
      border-radius: 3px;
      margin: 0 auto 24px;
    }
    .screen {
      min-height: 520px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
    }

    /* Step 1: Calling */
    #step-calling {
      text-align: center;
      width: 100%;
    }
    .avatar {
      width: 80px; height: 80px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px;
      margin: 30px auto 16px;
    }
    .calling-label {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .gp-name {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .call-status {
      font-size: 14px;
      color: #f59e0b;
    }
    .pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* Step 2: Redirecting */
    #step-redirect {
      text-align: center;
      width: 100%;
      display: none;
    }
    .redirect-icon {
      font-size: 48px;
      margin: 30px 0 16px;
    }
    .redirect-msg {
      font-size: 18px;
      font-weight: 600;
      color: #f59e0b;
      margin-bottom: 8px;
    }
    .redirect-sub {
      font-size: 14px;
      color: #94a3b8;
    }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #334155;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Step 3: Results */
    #step-results {
      width: 100%;
      display: none;
    }
    .results-header {
      text-align: center;
      margin-bottom: 16px;
    }
    .results-header .check {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .results-header h2 {
      font-size: 16px;
      font-weight: 600;
      color: #22c55e;
    }
    .results-header p {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .provider-card {
      background: #334155;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 10px;
    }
    .provider-card .pname {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .provider-card .pdetail {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .provider-card .pavail {
      font-size: 12px;
      color: #22c55e;
      font-weight: 500;
      margin: 6px 0;
    }
    .btn-row {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .btn {
      flex: 1;
      padding: 8px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      display: block;
    }
    .btn-call {
      background: #22c55e;
      color: #fff;
    }
    .btn-book {
      background: #3b82f6;
      color: #fff;
    }

    .sms-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px;
      margin-top: 14px;
      font-size: 12px;
      color: #94a3b8;
    }
    .sms-box .sms-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    /* Error */
    .error-msg {
      color: #ef4444;
      text-align: center;
      padding: 40px 10px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="phone">
    <div class="notch"></div>
    <div class="screen">

      <div id="step-calling">
        <div class="avatar">&#x1F468;&#x200D;&#x2695;&#xFE0F;</div>
        <div class="calling-label">Calling...</div>
        <div class="gp-name">Dr Smith's Practice</div>
        <div class="call-status pulse">After-hours voicemail detected</div>
      </div>

      <div id="step-redirect">
        <div class="redirect-icon">&#x1F504;</div>
        <div class="redirect-msg">GP is closed</div>
        <div class="redirect-sub">Redirecting to LittleHelp care finder...</div>
        <div class="spinner"></div>
      </div>

      <div id="step-results">
        <div class="results-header">
          <div class="check">&#x2705;</div>
          <h2>Nearby alternatives found</h2>
          <p id="results-subtitle"></p>
        </div>
        <div id="providers-list"></div>
        <div class="sms-box">
          <div class="sms-label">SMS sent to your phone</div>
          <div id="sms-content"></div>
        </div>
      </div>

    </div>
  </div>

  <script>
    const GP_NAME = "Dr Smith's Practice";

    async function run() {
      // Step 1: show calling for 2s
      await delay(2000);

      // Step 2: show redirect
      hide('step-calling');
      show('step-redirect');

      // Fetch data
      let data;
      try {
        const res = await fetch('/api/voicemail-redirect?gp_name=' + encodeURIComponent(GP_NAME));
        data = await res.json();
        if (data.error) throw new Error(data.error);
      } catch (err) {
        await delay(2000);
        hide('step-redirect');
        show('step-results');
        document.getElementById('providers-list').innerHTML =
          '<div class="error-msg">Could not reach the care finder service. Please try again later.<br><br>' + esc(String(err)) + '</div>';
        return;
      }

      await delay(2000);

      // Step 3: show results
      hide('step-redirect');
      show('step-results');

      document.getElementById('results-subtitle').textContent = data.message || '';

      var edWait = (data.ed_comparison && data.ed_comparison.estimated_wait) ? data.ed_comparison.estimated_wait : null;

      const list = document.getElementById('providers-list');
      const alts = data.alternatives || [];
      if (alts.length === 0) {
        list.innerHTML = '<div class="error-msg">No providers available right now.</div>';
      } else {
        list.innerHTML = alts.map(function(p) {
          const name = p.name || 'Clinic';
          const addr = p.address || '';
          const phone = p.phone || '';
          const avail = p.next_available || 'Available now';
          const bookUrl = p.booking_url || '#';
          var edLine = '';
          if (edWait) {
            edLine = '<div class="pdetail" style="color:#f59e0b;margin-top:4px;">Available ' + esc(avail) + ' vs nearest ED: est. ' + esc(edWait) + '</div>';
          }
          return '<div class="provider-card">' +
            '<div class="pname">' + esc(name) + '</div>' +
            (addr ? '<div class="pdetail">' + esc(addr) + '</div>' : '') +
            '<div class="pavail">' + esc(avail) + '</div>' +
            edLine +
            '<div class="btn-row">' +
              (phone ? '<a class="btn btn-call" href="tel:' + esc(phone) + '">Call</a>' : '') +
              '<a class="btn btn-book" href="' + esc(bookUrl) + '" target="_blank">Book</a>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      document.getElementById('sms-content').textContent = data.sms_message || '';
    }

    function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
    function show(id) { document.getElementById(id).style.display = 'block'; }
    function hide(id) { document.getElementById(id).style.display = 'none'; }
    function esc(s) {
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    run();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
