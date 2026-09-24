const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'mockRooms.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add buildingCode, campus, imageUrl
content = content.replace(/building: 'Khu K - Tòa A',/g, "building: 'Khu K - Tòa A',\n    campus: 'Khu K',\n    buildingCode: 'A',");
content = content.replace(/building: 'Khu K - Tòa B',/g, "building: 'Khu K - Tòa B',\n    campus: 'Khu K',\n    buildingCode: 'B',");
content = content.replace(/building: 'Khu K - Tòa C',/g, "building: 'Khu K - Tòa C',\n    campus: 'Khu K',\n    buildingCode: 'C',");
content = content.replace(/building: 'Khu V - Tòa A',/g, "building: 'Khu V - Tòa A',\n    campus: 'Khu V',\n    buildingCode: 'V',");

// Fallback for special ones
content = content.replace(/building: 'Thư viện',/g, "building: 'Thư viện',\n    campus: 'Khu K',");
content = content.replace(/building: 'Hội trường khu K',/g, "building: 'Hội trường khu K',\n    campus: 'Khu K',");
content = content.replace(/building: 'Hội trường tròn',/g, "building: 'Hội trường tròn',\n    campus: 'Khu K',");
content = content.replace(/building: 'Hội trường khu V',/g, "building: 'Hội trường khu V',\n    campus: 'Khu V',");

// Add some random images
const images = [
  'https://images.unsplash.com/photo-1576101185859-992ee6ffb7f7?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580602075594-b152775f0a71?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517520286547-4cf2f1832274?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=600&auto=format&fit=crop'
];

let imgIndex = 0;
content = content.replace(/available: (true|false),/g, (match) => {
  const replacement = `${match}\n    imageUrl: '${images[imgIndex % images.length]}',`;
  imgIndex++;
  return replacement;
});

fs.writeFileSync(filePath, content);
console.log('mockRooms.ts updated successfully.');
