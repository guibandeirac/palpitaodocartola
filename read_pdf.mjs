import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

const buf = readFileSync('CHAMPIONS 2026 - 15 RODADA.pdf');
const data = new Uint8Array(buf);
const doc = await getDocument({ data }).promise;

console.log('Páginas:', doc.numPages);

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  const text = content.items.map(i => i.str).join(' ');
  console.log(`\n=== Página ${p} ===`);
  console.log(text);
}
