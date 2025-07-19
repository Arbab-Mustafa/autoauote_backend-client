
const express = require('express');
const router = express.Router();

router.get('/kpi-report', (req, res) => {
  const sample = [
    { date: '2025-07-01', dealerId: '123', quotes: 5, conversions: 2, revenue: 900 },
    { date: '2025-07-02', dealerId: '123', quotes: 7, conversions: 3, revenue: 1400 },
    { date: '2025-07-03', dealerId: '123', quotes: 4, conversions: 1, revenue: 450 }
  ];
  res.status(200).json(sample);
});

module.exports = router;
