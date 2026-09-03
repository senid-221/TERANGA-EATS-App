const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf-8');

// dbFetchOrders
code = code.replace(/const local = localStorage\.getItem\('teranga_orders_db'\);\s*return local \? JSON\.parse\(local\) : \[\];/g, 'return [];');
// dbInsertOrder
code = code.replace(/try\s*\{\s*const local = localStorage\.getItem\('teranga_orders_db'\);\s*const existing: Order\[\] = local \? JSON\.parse\(local\) : \[\];\s*\/\/ remove any duplicates\s*const filtered = existing\.filter\(\(o\) => o\.id !== order\.id\);\s*localStorage\.setItem\('teranga_orders_db', JSON\.stringify\(\[order, \.\.\.filtered\]\)\);\s*\}\s*catch\s*\(e\)\s*\{\s*console\.error\('LocalStorage write failed:', e\);\s*\}/, '');

// dbUpdateOrderStatus
code = code.replace(/\/\/ Update local storage\s*try\s*\{\s*const local = localStorage\.getItem\('teranga_orders_db'\);\s*if\s*\(local\)\s*\{\s*const existing: Order\[\] = JSON\.parse\(local\);\s*const updated = existing\.map\(\(o\) =>\s*\{\s*if\s*\(o\.id === orderId\)\s*\{\s*return\s*\{\s*\.\.\.o,\s*orderStatus: status,\s*deliveredAt: status === 'delivered' \? new Date\(\)\.toISOString\(\) : o\.deliveredAt,\s*statusHistory: \[\s*\.\.\.o\.statusHistory,\s*\{\s*status,\s*timestamp: new Date\(\)\.toISOString\(\),\s*noteFR: noteFR \|\| `Statut : \$\{status\}`,\s*noteEN: noteEN \|\| `Status: \$\{status\}`,\s*\},\s*\],\s*\};\s*\}\s*return o;\s*\}\);\s*localStorage\.setItem\('teranga_orders_db', JSON\.stringify\(updated\)\);\s*\}\s*\}\s*catch\s*\(e\)\s*\{\s*console\.error\('LocalStorage update error:', e\);\s*\}/g, '');

// dbFetchBookings
code = code.replace(/const local = localStorage\.getItem\('teranga_bookings_db'\);\s*return local \? JSON\.parse\(local\) : \[\];/g, 'return [];');

// dbInsertBooking
code = code.replace(/try\s*\{\s*const local = localStorage\.getItem\('teranga_bookings_db'\);\s*const existing: TableBooking\[\] = local \? JSON\.parse\(local\) : \[\];\s*const filtered = existing\.filter\(\(b\) => b\.id !== booking\.id\);\s*localStorage\.setItem\('teranga_bookings_db', JSON\.stringify\(\[booking, \.\.\.filtered\]\)\);\s*\}\s*catch\s*\(e\)\s*\{\s*console\.error\('LocalStorage write error:', e\);\s*\}/g, '');

// dbCancelBooking
code = code.replace(/try\s*\{\s*const local = localStorage\.getItem\('teranga_bookings_db'\);\s*if\s*\(local\)\s*\{\s*const existing: TableBooking\[\] = JSON\.parse\(local\);\s*const updated = existing\.map\(\(b\) => \(b\.id === bookingId \? \{ \.\.\.b, status: 'cancelled' as const \} : b\)\);\s*localStorage\.setItem\('teranga_bookings_db', JSON\.stringify\(updated\)\);\s*\}\s*\}\s*catch\s*\(e\)\s*\{\s*console\.error\('LocalStorage error:', e\);\s*\}/g, '');

// Save
fs.writeFileSync('src/lib/supabase.ts', code);
