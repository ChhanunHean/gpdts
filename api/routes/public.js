// ============================================================
// GPDTS 2026 - Public API Routes (READ ONLY FOR PUBLIC)
// ============================================================
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { getData } = require('../lib/store');

// GET /api/data - Full live event state (students, photos, schedule, fees, etc.)
router.get('/data', (req, res) => {
  const d = getData();
  if (d) return res.json(d);
  res.status(500).json({ error: 'Data not available' });
});

// Default fallback data with financial fees & budget
const DEFAULT_DATA = {
  meta: {
    brand: "GPDTS 2026",
    title: "GPDTS",
    kicker: "Poipet, Cambodia · 2026",
    lede: "Gon Preah Discipleship Training School. Six months of knowing God and knowing themselves."
  },
  pray: {
    title: "4 students don't know Jesus yet",
    text: "Our goal: 4 students come to know God during this school. Please pray for them."
  },
  pillars: [
    { h: "Identity", p: "Knowing who they are, what they carry, and who God is for their own life." },
    { h: "Purpose", p: "Seeing their calling more clearly — what they love, and what God has for them." },
    { h: "Sharing", p: "Carrying it back out into Cambodia's seven spheres of society." }
  ],
  goals: {
    outreach: [
      "Share the gospel with 2,500+ people",
      "200 people receive salvation",
      "100 testimonies or reports of healing",
      "Cultural activities during the trip"
    ],
    classroom: [
      "4 students come to know God",
      "100% submit weekly assignments on time",
      "100% complete a skills course",
      "7 students take part in Discovery Bible Study"
    ]
  },
  fees: {
    lecture: 1200,
    outreach: 1800,
    currency: "USD",
    account: "000 123 456 (ABA Bank)",
    accountName: "GPDTS Poipet Ministry",
    note: "Tuition covers accommodation, meals, and discipleship materials for 6 months."
  },
  budget: {
    goal: 15000,
    raised: 6850,
    currency: "USD"
  },
  students: [
    { id: 1, name: "Josha Thoreson", nick: null, from: "Canada", born: "2008-02-29", gender: "Male", pray: false, photo: null, fee_due: 3000, fee_paid: 3000 },
    { id: 2, name: "Chea SreyPich", nick: "Srey Pich", from: "Poipet", born: "2008-11-09", gender: "Female", pray: true, photo: null, fee_due: 1500, fee_paid: 800 },
    { id: 3, name: "Sanh PeyPey", nick: null, from: "Oddar Meanchey", born: "2005-03-26", gender: "Female", pray: false, photo: null, fee_due: 1500, fee_paid: 1500 },
    { id: 4, name: "Ny Punleu", nick: null, from: "Tbong Khmum", born: "2008-12-12", gender: "Female", pray: false, photo: null, fee_due: 1500, fee_paid: 500 },
    { id: 5, name: "Soum Chanthy", nick: "Chanthy", from: "Poipet", born: "2007-07-16", gender: "Female", pray: true, photo: null, fee_due: 1500, fee_paid: 1200 },
    { id: 6, name: "Leng Leehour", nick: "Leehour", from: "Poipet", born: "2007-06-08", gender: "Female", pray: true, photo: null, fee_due: 1500, fee_paid: 1500 },
    { id: 7, name: "Sok Sokhom", nick: null, from: "Phnom Penh", born: "1997-08-21", gender: "Male", pray: false, photo: null, fee_due: 2000, fee_paid: 2000 }
  ]
};

// GET /api/event - full event bundle (Public View - Read Only)
router.get('/event', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.json(DEFAULT_DATA);
    }

    const [event, pillars, goals, students] = await Promise.all([
      supabase.from('event').select('*').eq('id', 1).single(),
      supabase.from('pillars').select('*').order('sort_order'),
      supabase.from('goals').select('*').order('sort_order'),
      supabase.from('students').select('*').order('sort_order'),
    ]);

    if (event.error || !event.data) {
      return res.json(DEFAULT_DATA);
    }

    const outreachGoals = (goals.data || [])
      .filter(g => g.category === 'outreach')
      .map(g => g.goal_text);

    const classroomGoals = (goals.data || [])
      .filter(g => g.category === 'classroom')
      .map(g => g.goal_text);

    res.json({
      meta: {
        brand: event.data.brand,
        title: event.data.title,
        kicker: event.data.kicker,
        lede: event.data.lede,
      },
      pray: {
        title: event.data.pray_title,
        text: event.data.pray_text,
      },
      pillars: (pillars.data || []).map(p => ({ h: p.heading, p: p.description })),
      goals: {
        outreach: outreachGoals.length ? outreachGoals : DEFAULT_DATA.goals.outreach,
        classroom: classroomGoals.length ? classroomGoals : DEFAULT_DATA.goals.classroom,
      },
      fees: DEFAULT_DATA.fees,
      budget: DEFAULT_DATA.budget,
      students: (students.data || []).map(s => ({
        id: s.id,
        name: s.name,
        nick: s.nick,
        from: s.from_location,
        born: s.born,
        gender: s.gender,
        pray: s.pray,
        photo: s.photo_url || null,
        fee_due: s.fee_due || 1500,
        fee_paid: s.fee_paid || 0,
      })),
    });
  } catch (err) {
    console.warn('Falling back to default event data:', err.message);
    res.json(DEFAULT_DATA);
  }
});

// GET /api/finances - Public Read-Only Finances
router.get('/finances', (req, res) => {
  res.json({
    fees: DEFAULT_DATA.fees,
    budget: DEFAULT_DATA.budget
  });
});

// GET /api/students
router.get('/students', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL) return res.json(DEFAULT_DATA.students);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('sort_order');
    if (error || !data) return res.json(DEFAULT_DATA.students);
    res.json(data);
  } catch (err) {
    res.json(DEFAULT_DATA.students);
  }
});

module.exports = router;
