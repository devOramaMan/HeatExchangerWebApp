const fs = require('fs');
const path = require('path');

// Create dist directories
const distDir = path.join(__dirname, '..', 'wwwroot', 'dist');
const cssDir = path.join(distDir, 'css');
const jsDir = path.join(distDir, 'js');

// Ensure directories exist
[distDir, cssDir, jsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// File copy operations
const copyOperations = [
    // Bootstrap CSS
    {
        source: path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css'),
        dest: path.join(cssDir, 'bootstrap.min.css'),
        name: 'Bootstrap CSS'
    },
    // Bootstrap JS
    {
        source: path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist', 'js', 'bootstrap.bundle.min.js'),
        dest: path.join(jsDir, 'bootstrap.bundle.min.js'),
        name: 'Bootstrap JS'
    },
    // Chart.js
    {
        source: path.join(__dirname, '..', 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
        dest: path.join(jsDir, 'chart.umd.js'),
        name: 'Chart.js'
    }
];

// Perform copy operations
console.log('Building frontend assets...');
let errors = 0;

copyOperations.forEach(({ source, dest, name }) => {
    try {
        if (fs.existsSync(source)) {
            fs.copyFileSync(source, dest);
            console.log(`✓ Copied ${name}: ${path.basename(dest)}`);
        } else {
            console.error(`✗ Source file not found for ${name}: ${source}`);
            errors++;
        }
    } catch (error) {
        console.error(`✗ Failed to copy ${name}: ${error.message}`);
        errors++;
    }
});

if (errors === 0) {
    console.log('\n🎉 Build completed successfully!');
    console.log(`Files copied to: ${distDir}`);
} else {
    console.error(`\n❌ Build completed with ${errors} error(s)`);
    process.exit(1);
}