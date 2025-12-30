import sanitize from 'mongo-sanitize';

console.log('Type of sanitize:', typeof sanitize);
console.log('Sanitize value:', sanitize);
if (typeof sanitize !== 'function') {
    console.log('Is Default function?', typeof sanitize.default);
}

const testObj = { '$gt': 1, 'safe': 'value' };
try {
    const cleaned = sanitize(testObj);
    console.log('Cleaned:', JSON.stringify(cleaned));
} catch (e) {
    console.error('Sanitize call failed:', e.message);
}
