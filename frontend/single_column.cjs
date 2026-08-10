const fs = require('fs');
let content = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

// Replace the layout container
content = content.replace(
    /className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-gray-300 dark:divide-gray-600"/,
    'className="flex flex-col gap-6"'
);

// Checkboxes grid
content = content.replace(
    /className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1 mb-2"/,
    'className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-2 mb-2"'
);

// Right column container - remove padding left and add a subtle separator if needed
content = content.replace(
    /className="flex flex-col gap-5 lg:pl-8 pt-4 lg:pt-0"/,
    'className="flex flex-col gap-5 pt-4 border-t border-gray-300 dark:border-gray-600"'
);

// Make the inputs take a bit more proportional space where they were flex-1
// Left column elements
content = content.replace(
    /className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0 max-w-\[220px\]"/g,
    'className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0"'
);

// Ensure the questions that were taking max-w-[260px] don't wrap too early now that they have full width
content = content.replace(
    /max-w-\[260px\]/g,
    'max-w-2xl'
);


fs.writeFileSync('src/components/PacienteCreateView.tsx', content);
