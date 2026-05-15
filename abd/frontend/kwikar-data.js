// Kwikar ABD Panel — Default empty state (populated from API after login)
window.KD = {
  abd: {
    name: "ABD User",
    id: "",
    area: "",
    pincodes: [],
    avatar: "AU",
    rating: 0,
    level: "ABD",
    joinedDate: "",
    phone: "",
    email: "",
    aadhaar: "KYC Pending",
    pan: "KYC Pending",
    bank: "Not linked",
    upi: "Not linked"
  },

  earnings: {
    total: 0,
    today: 0,
    thisMonth: 0,
    wallet: 0,
    directReferral: 0,
    indirectReferral: 0,
    pending: 0,
    totalWithdrawals: 0,
    trend: 0
  },

  technicians: { total: 0, direct: 0, referral: 0, active: 0, inactive: 0 },
  bookings:    { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 },

  revenueData: Array(30).fill(0),

  activityFeed:       [],
  directTechnicians:  [],
  autoJoined:         [],
  bookingsList:       [],
  transactions:       [],
  pincodes:           [],
  notifications:      [],
  complaints:         [],

  referralTree: {
    id: "abd-0", name: "ABD User", role: "ABD", avatar: "AU",
    skill: "Area Director", earnings: 0, abdCommission: 0,
    level: 0, status: "active", children: []
  }
};

// ── API helper ────────────────────────────────────────────────────────────────
window.abdApi = async function(module, bodyOrQs, method) {
  const base = window.location.pathname.replace(/\/frontend\/.*/, '') + '/backend/api/api.php';
  let url = base + '?module=' + module;

  // Always attach stored phone so backend can restore session even if cookie is lost
  const storedPhone = sessionStorage.getItem('abd_phone');
  if (storedPhone && module !== 'login' && module !== 'register') {
    url += '&_ph=' + encodeURIComponent(storedPhone);
  }

  if (typeof bodyOrQs === 'string') url += '&' + bodyOrQs;

  const opts = { credentials: 'include' };
  if (method === 'POST' || (bodyOrQs && typeof bodyOrQs === 'object')) {
    opts.method = 'POST';
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(typeof bodyOrQs === 'object' ? bodyOrQs : {});
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
};

// ── Session storage ───────────────────────────────────────────────────────────
window.ABD_SESSION = null;
