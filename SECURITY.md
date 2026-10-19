# Contact endpoint and deployment

- Resend keys stay on the server (`RESEND_API_KEY`). No client environment variable is used for them.
- `api/send-email.js` accepts POST JSON only, rejects foreign browser origins, caps the body at 64 KiB and each known field at 5,000 characters, validates identity/email fields and escapes email HTML.
- The destination and sender are configured server-side. User input cannot change the recipient.
- Failed Resend responses return an error instead of a success message. Logs do not include form contents.
- The hidden `website` field is a honeypot. Requests are limited to five attempts per 15 minutes per IP. If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, a single atomic Redis script enforces this across all instances. Configure `CONTACT_RATE_LIMIT_SECRET` as a long random server-only secret; Redis receives only an HMAC of the IP and a counter, not form data. An outage or partial Redis configuration rejects sending rather than bypassing the limit. On Vercel the IP comes from its trusted edge header; locally client forwarding headers are ignored.
- Without Redis credentials the fallback is **per warm instance only**, not global. Activation of the distributed protection therefore still requires external Redis configuration in Vercel; alternatively enforce a global edge/WAF rule. Tests use a mocked Redis endpoint, not a live service.
- A request UUID and a hash of the normalized payload form the Resend idempotency key. Retrying the same submission reuses the key; changing the payload creates a distinct one. Resend retains idempotency keys for 24 hours: https://resend.com/docs/dashboard/emails/idempotency-keys.
- The frontend times out after 25 seconds and Resend requests after 15 seconds. The wizard does not send on Enter before step six, and every panel is revalidated before sending. Required service/budget choices and numeric bounds are enforced server-side as well.
- `.env` files and Vercel local configuration are ignored by Git. `.env.example` contains placeholders only.
- Vercel response headers restrict framing, external script execution, object embeds and unnecessary browser permissions. CSP permits inline styles for existing components; inline scripts remain blocked.
- Do not add health/form data to analytics, logs, URLs or browser storage.

Checks: `node --test tests/send-email.test.js`, `npm audit`, `npm run build`.
The email tests mock the provider; they do not send mail. Delivery and production headers must be verified after deployment with the configured sender domain and Resend key.

Redis REST command reference: https://upstash.com/docs/redis/features/restapi.
