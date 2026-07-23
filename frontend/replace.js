const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('d:/projects/bulkping/frontend/src');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Match single quotes
    content = content.replace(/'https:\/\/apibulkping\.senseforge\.in\/api(.*?)'/g, '`${process.env.NEXT_PUBLIC_API_URL}$1`');
    
    // Match backticks
    content = content.replace(/`https:\/\/apibulkping\.senseforge\.in\/api(.*?)`/g, '`${process.env.NEXT_PUBLIC_API_URL}$1`');

    if (content !== original) {
        fs.writeFileSync(file, content);
        count++;
        console.log('Updated:', file);
    }
});
console.log(`Total files updated: ${count}`);
