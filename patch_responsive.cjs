const fs = require('fs');
let code = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');

// Change the main container to flex row on md+ screens
code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">/g,
  '<div className="flex flex-col md:flex-row gap-4 h-full">'
);

// Left Panel (Products)
code = code.replace(
  /<div className="lg:col-span-2 space-y-3">/g,
  '<div className="flex-1 space-y-3 min-w-0">'
);

// Right Panel (Cart)
code = code.replace(
  /<div className="bg-white border rounded-xl shadow-sm flex flex-col h-fit lg:h-\[calc\(100vh-120px\)\] sticky top-4">/g,
  '<div className="bg-white border rounded-xl shadow-sm flex flex-col h-fit md:h-[calc(100vh-100px)] sticky top-4 w-full md:w-80 xl:w-96 flex-shrink-0">'
);

// Product Grid Columns (optimize for flexible width)
code = code.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-\[60vh\] overflow-y-auto pr-1">/g,
  '<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:max-h-[calc(100vh-160px)] overflow-y-auto pr-1 pb-4">'
);

// Remove specific fixed heights from Cart items area to let it flex properly
code = code.replace(
  /<div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0">/g,
  '<div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-[200px] md:min-h-0">'
);

fs.writeFileSync('src/features/cashier/Cashier.tsx', code);
