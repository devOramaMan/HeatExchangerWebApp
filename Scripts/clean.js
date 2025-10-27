const fs = require('fs');
const path = require('path');

// Remove dist directory
const distDir = path.join(__dirname, '..', 'wwwroot', 'dist');

function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`✓ Removed: ${dirPath}`);
        return true;
    } else {
        console.log(`Directory doesn't exist: ${dirPath}`);
        return false;
    }
}

console.log('Cleaning build artifacts...');
removeDirectory(distDir);
console.log('🧹 Clean completed!');