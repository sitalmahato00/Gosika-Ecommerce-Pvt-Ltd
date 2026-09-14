&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
    &lt;meta charset="utf-8"&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;
    &lt;meta name="x-apple-disable-message-reformatting"&gt;
    &lt;meta http-equiv="X-UA-Compatible" content="IE=edge"&gt;
    &lt;title&gt;{{ $brand['email_header'] ?? $brand['brand_name'] }}&lt;/title&gt;
    &lt;style&gt;
        body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
        table { border-collapse: collapse; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f6f9; padding: 24px 0; }
        .container { max-width: 620px; margin: 0 auto; width: 100%; }
        .card { background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 24px rgba(2, 6, 23, 0.06); }
        .header { background: #161d2b; padding: 24px 32px; }
        .header-brand { display: flex; align-items: center; gap: 12px; }
        .header-title { color: #cbd5e1; font-size: 13px; margin-top: 4px; letter-spacing: 0.02em; }
        .content { padding: 32px; }
        h1 { margin: 0 0 12px; font-size: 22px; color: #0f172a; font-weight: 800; }
        p { margin: 0 0 14px; font-size: 14px; line-height: 1.6; color: #334155; }
        .muted { color: #64748b; font-size: 12.5px; }
        .code { display: inline-block; background: #fff7ed; border: 1px dashed #ff7733; color: #ff5500; font-size: 26px; font-weight: 800; letter-spacing: 6px; padding: 12px 20px; border-radius: 10px; margin: 8px 0 4px; }
        .btn { display: inline-block; background: #ff5500; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 8px; }
        .btn:hover { background: #e04b00; }
        .table { width: 100%; font-size: 13px; margin: 12px 0; }
        .table th { background: #f8fafc; color: #475569; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 10px; text-align: left; }
        .table td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .totals { width: 100%; margin-top: 8px; }
        .totals td { padding: 5px 10px; font-size: 13px; color: #475569; }
        .totals .grand { font-size: 16px; font-weight: 800; color: #0f172a; }
        .divider { height: 1px; background: #f1f5f9; margin: 18px 0; }
        .step { display: block; margin-bottom: 10px; padding-left: 26px; position: relative; font-size: 13.5px; color: #334155; }
        .step-badge { position: absolute; left: 0; top: 0; width: 18px; height: 18px; border-radius: 50%; background: #ff5500; color: #fff; font-size: 10px; font-weight: 800; text-align: center; line-height: 18px; }
        .alert { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 10px; padding: 12px 14px; font-size: 13px; margin: 10px 0; }
        .footer { background: #f8fafc; padding: 22px 32px; font-size: 12px; color: #64748b; }
        .footer a { color: #ff5500; text-decoration: none; }
        @media (max-width: 600px) { .content, .header, .footer { padding-left: 20px; padding-right: 20px; } }
    &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
&lt;table role="presentation" class="wrapper"&gt;
    &lt;tr&gt;&lt;td align="center"&gt;
        &lt;table role="presentation" class="container"&gt;
            &lt;tr&gt;&lt;td&gt;
                &lt;div class="card"&gt;
                    &lt;div class="header"&gt;
                        &lt;div class="header-brand"&gt;
                            &lt;span style="font-weight:900; color:#ff5500; font-size:20px; letter-spacing:-0.02em;"&gt;{{ $brand['brand_name'] }}&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class="header-title"&gt;{{ $brand['email_header'] }}&lt;/div&gt;
                    &lt;/div&gt;
                    &lt;div class="content"&gt;
                        @yield('content')
                    &lt;/div&gt;
                    &lt;div class="footer"&gt;
                        &lt;p style="margin:0 0 6px; font-weight:700; color:#0f172a;"&gt;{{ $brand['brand_name'] }} Marketplace&lt;/p&gt;
                        &lt;p style="margin:0 0 4px;"&gt;Questions? We are here to help — &lt;a href="mailto:{{ $brand['support_email'] }}"&gt;{{ $brand['support_email'] }}&lt;/a&gt; or call &lt;a href="tel:{{ $brand['support_phone'] }}"&gt;{{ $brand['support_phone'] }}&lt;/a&gt;&lt;/p&gt;
                        &lt;p style="margin:0;"&gt;You are receiving this email because of activity on your {{ $brand['brand_name'] }} account.&lt;/p&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            &lt;/td&gt;&lt;/tr&gt;
        &lt;/table&gt;
    &lt;/td&gt;&lt;/tr&gt;
&lt;/table&gt;
&lt;/body&gt;
&lt;/html&gt;