const {getDb} = require('./db/database.js');

const db = getDb();
const keyword = 'SP00000011';

const result = db.prepare(`
  SELECT MAHDB FROM HOADONBAN 
  WHERE EXISTS (
    SELECT 1 FROM CT_HOADONBAN ct 
    JOIN HANGHOA hh ON hh.MASP = ct.MASP 
    WHERE ct.MAHDB = HOADONBAN.MAHDB 
    AND (ct.MASP LIKE ? OR hh.TENSP LIKE ?)
  )
`).all(`%${keyword}%`, `%${keyword}%`);

console.log('Found invoices:', JSON.stringify(result, null, 2));
