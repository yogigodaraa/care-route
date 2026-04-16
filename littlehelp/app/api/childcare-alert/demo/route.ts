import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Childcare Alert Demo - LittleHelp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FFF7ED;
      color: #1a1a1a;
      padding: 20px;
      max-width: 480px;
      margin: 0 auto;
    }
    h1 { font-size: 18px; color: #9A3412; margin-bottom: 16px; text-align: center; }
    .alert-card {
      background: #FEF2F2;
      border: 2px solid #FECACA;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .alert-card .badge {
      display: inline-block;
      background: #DC2626;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 99px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .alert-card h2 { font-size: 16px; margin-bottom: 6px; color: #991B1B; }
    .alert-card p { font-size: 14px; color: #7F1D1D; line-height: 1.5; }
    .section-label {
      font-size: 13px;
      font-weight: 600;
      color: #92400E;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .provider-card {
      background: white;
      border: 1px solid #FED7AA;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .provider-card h3 { font-size: 15px; color: #1a1a1a; margin-bottom: 4px; }
    .provider-card .avail {
      font-size: 13px;
      color: #15803D;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .provider-card .meta { font-size: 13px; color: #6B7280; line-height: 1.6; }
    .provider-card .meta a { color: #2563EB; text-decoration: none; }
    .ed-note {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 12px;
      padding: 14px;
      font-size: 13px;
      color: #166534;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .send-btn {
      display: block;
      width: 100%;
      background: #EA580C;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 16px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .send-btn:hover { background: #C2410C; }
    .send-btn:disabled { background: #9CA3AF; cursor: not-allowed; }
    #status {
      margin-top: 14px;
      padding: 12px;
      border-radius: 10px;
      font-size: 13px;
      display: none;
      line-height: 1.5;
    }
    #status.success { display: block; background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
    #status.error { display: block; background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
    .form-row { margin-bottom: 12px; }
    .form-row label { display: block; font-size: 12px; font-weight: 600; color: #78716C; margin-bottom: 4px; }
    .form-row input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #D6D3D1;
      border-radius: 8px;
      font-size: 14px;
      background: white;
    }
  </style>
</head>
<body>
  <h1>LittleHelp \u2014 Childcare Alert Demo</h1>

  <div class="alert-card">
    <span class="badge">Childcare Alert</span>
    <h2>Bright Stars Childcare</h2>
    <p><strong>Emma</strong> has a <strong>fever and runny nose</strong>.<br>Please arrange pick-up as soon as possible.</p>
  </div>

  <div class="section-label">We found care nearby</div>

  <div id="providers-loading" style="text-align:center;padding:30px;">
    <div style="display:inline-block;width:32px;height:32px;border:3px solid #FED7AA;border-top-color:#EA580C;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    <p style="margin-top:10px;font-size:13px;color:#92400E;">Finding nearby providers...</p>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  </div>

  <div id="providers-error" style="display:none;background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:16px;margin-bottom:20px;font-size:13px;color:#991B1B;"></div>

  <div id="providers-list"></div>

  <div id="ed-note" class="ed-note" style="display:none;"></div>

  <div class="section-label">Send alert to parent</div>

  <div class="form-row">
    <label>Parent phone</label>
    <input type="tel" id="phone" value="0412345678" />
  </div>
  <div class="form-row">
    <label>Child name</label>
    <input type="text" id="childName" value="Emma" />
  </div>
  <div class="form-row">
    <label>Symptoms</label>
    <input type="text" id="symptoms" value="fever, runny nose" />
  </div>

  <button class="send-btn" id="sendBtn" onclick="sendAlert()">Send SMS Alert to Parent</button>
  <div id="status"></div>

  <script>
    (async function loadProviders() {
      const loading = document.getElementById('providers-loading');
      const errorEl = document.getElementById('providers-error');
      const listEl = document.getElementById('providers-list');
      const edNote = document.getElementById('ed-note');

      try {
        const res = await fetch('/api/find-provider?symptom=fever&location=123+George+St+Sydney+NSW+2000');
        if (!res.ok) throw new Error('API returned ' + res.status);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        loading.style.display = 'none';

        const providers = data.providers || [];
        if (providers.length === 0) {
          errorEl.style.display = 'block';
          errorEl.textContent = 'No providers found nearby. Please try again later.';
          return;
        }

        const edWait = data.ed_comparison ? data.ed_comparison.estimated_wait : null;
        const edName = data.ed_comparison ? data.ed_comparison.nearest_ed : null;

        providers.forEach(function(p) {
          const card = document.createElement('div');
          card.className = 'provider-card';

          const name = p.name || 'Unknown Provider';
          const address = p.address || '';
          const phone = p.phone || '';
          const avail = p.availability || {};
          const nextAvail = avail.next_available || 'Check availability';
          const profileUrl = avail.profile_url || '';

          let html = '<h3>' + escapeHtml(name) + '</h3>';
          html += '<div class="avail">\u2705 ' + escapeHtml(nextAvail) + '</div>';

          if (edWait) {
            html += '<div style="font-size:12px;color:#92400E;margin-bottom:6px;">Available ' + escapeHtml(nextAvail) + ' vs nearest ED: est. ' + escapeHtml(edWait) + '</div>';
          }

          html += '<div class="meta">';
          if (address) html += escapeHtml(address) + '<br>';
          if (phone) html += 'Call: <a href="tel:' + escapeHtml(phone) + '">' + escapeHtml(phone) + '</a><br>';
          if (profileUrl) html += 'Book: <a href="' + escapeHtml(profileUrl) + '" target="_blank">' + escapeHtml(profileUrl) + '</a>';
          html += '</div>';

          card.innerHTML = html;
          listEl.appendChild(card);
        });

        if (data.ed_comparison) {
          edNote.style.display = 'block';
          edNote.innerHTML = '\ud83c\udfe5 No need for ED \u2014 estimated ' + escapeHtml(edWait) + ' wait at ' + escapeHtml(edName) + '.<br>A GP can see Emma today and is much faster.';
        }

      } catch (e) {
        loading.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<strong>Failed to load providers:</strong> ' + escapeHtml(e.message);
      }
    })();

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    async function sendAlert() {
      const btn = document.getElementById('sendBtn');
      const status = document.getElementById('status');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      status.className = '';
      status.style.display = 'none';

      try {
        const res = await fetch('/api/childcare-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parent_phone: document.getElementById('phone').value,
            child_name: document.getElementById('childName').value,
            symptoms: document.getElementById('symptoms').value,
            childcare_name: 'Bright Stars Childcare',
            childcare_address: '123 George St, Sydney NSW 2000',
          }),
        });
        const data = await res.json();
        if (data.success) {
          status.className = 'success';
          status.innerHTML = '<strong>SMS sent!</strong><br><pre style="white-space:pre-wrap;margin-top:8px;font-size:12px;">' + (data.sms_preview || '') + '</pre>';
        } else {
          status.className = 'error';
          status.innerHTML = '<strong>Error:</strong> ' + (data.error || 'Unknown error');
          if (data.sms_preview) {
            status.innerHTML += '<br><br><strong>SMS preview:</strong><pre style="white-space:pre-wrap;margin-top:8px;font-size:12px;">' + data.sms_preview + '</pre>';
          }
        }
      } catch (e) {
        status.className = 'error';
        status.textContent = 'Network error: ' + e.message;
      }
      btn.disabled = false;
      btn.textContent = 'Send SMS Alert to Parent';
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
