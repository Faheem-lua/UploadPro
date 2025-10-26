import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  const id = randomUUID();
  const fileName = req.headers['x-file-name'] || 'file.zip';
  const out = join(process.cwd(), 'public', 'file', id + '.zip');
  await writeFile(out, buffer);
  const url = `https://${req.headers.host}/file/${id}.zip`;
  res.json({ url });
};