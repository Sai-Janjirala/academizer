function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '';
}

/** /24 IPv4 prefix for “same classroom LAN” checks (browser cannot read Wi‑Fi SSID). */
function subnetPrefix24(ip) {
  const v4 = String(ip).replace(/^::ffff:/i, '');
  const parts = v4.split('.');
  if (parts.length >= 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return v4;
}

module.exports = { getClientIp, subnetPrefix24 };
