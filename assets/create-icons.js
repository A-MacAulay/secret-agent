// Script to create simple tray icons
// Run: node assets/create-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple 16x16 PNG icon (spy-themed dark circle)
function createIcon(size, filename) {
  // PNG header and minimal data for a simple icon
  // This creates a basic circular icon
  
  const width = size;
  const height = size;
  
  // Create raw RGBA data
  const data = Buffer.alloc(width * height * 4);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 1;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (dist <= radius) {
        // Inside circle - dark gray for template image
        data[idx] = 80;     // R
        data[idx + 1] = 80; // G
        data[idx + 2] = 80; // B
        data[idx + 3] = 255; // A
      } else {
        // Outside - transparent
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }
  
  // Create PNG manually (simplified)
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // For now, just save a placeholder message
  const placeholder = `Placeholder for ${filename} (${size}x${size})\nReplace with actual PNG icon`;
  fs.writeFileSync(path.join(__dirname, filename + '.txt'), placeholder);
  
  console.log(`Created placeholder for ${filename}`);
}

createIcon(16, 'iconTemplate');
createIcon(32, 'iconTemplate@2x');
createIcon(256, 'icon');

console.log('\nNote: Replace the .txt placeholder files with actual PNG icons:');
console.log('- iconTemplate.png (16x16) - macOS tray icon');
console.log('- iconTemplate@2x.png (32x32) - macOS tray icon retina');
console.log('- icon.png (256x256) - app icon');
console.log('- icon.ico - Windows icon');
