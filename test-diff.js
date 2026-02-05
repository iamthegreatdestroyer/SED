const diff = `@@ -1,5 +1,6 @@
 context line
-deleted line
+added line 1
+added line 2
 more context`;

console.log('Diff output:');
console.log(diff);
console.log('');
console.log('Line-by-line:');
diff.split('\n').forEach((l, i) => console.log(`${i}: "${l}"`));

console.log('');
console.log('Parsing with same logic as parseHunks:');
const lines = diff.split('\n');
let count = 0;
for (const line of lines) {
  if (line.startsWith(' ')) {
    console.log('CONTEXT:', JSON.stringify(line));
    count++;
  } else if (line.startsWith('+')) {
    console.log('ADD:', JSON.stringify(line));
    count++;
  } else if (line.startsWith('-')) {
    console.log('DEL:', JSON.stringify(line));
    count++;
  } else {
    console.log('SKIP (header):', JSON.stringify(line));
  }
}
console.log('Total diff lines counted:', count);
