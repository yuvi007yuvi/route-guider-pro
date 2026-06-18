const fs = require('fs');
const path = require('path');

const API_VAR = "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`";

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace single quoted string: 'http://localhost:5000/api/...' -> `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/...`
    content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, (match, p1) => {
        modified = true;
        return "`" + "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}" + p1 + "`";
    });

    // Replace inside template literals: `http://localhost:5000/api/...` -> `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/...`
    content = content.replace(/http:\/\/localhost:5000/g, (match) => {
        // If it's already inside a template literal (like we just replaced), don't double replace it.
        // Wait, the first regex replaced the single quoted ones. The remaining ones are mostly in backticks.
        // Let's just replace http://localhost:5000 with ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}
        modified = true;
        return "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}";
    });
    
    // Fix any double replacements that might have occurred
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| '\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}'\}/g, "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

traverse(path.join(__dirname, 'src'));
