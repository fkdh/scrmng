import fs from 'fs';
import path from 'path';
import axios from 'axios';

const CONCURRENCY = 5;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Download a single image with retry logic
 */
export async function downloadSingleImage(
  url: string,
  destPath: string,
  timeout = 60000,
  retries = MAX_RETRIES
): Promise<void> {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://komiku.org/',
          Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        validateStatus: (status) => status >= 200 && status < 300,
      });

      const contentType = String(response.headers['content-type'] || '');
      if (!contentType.startsWith('image/')) {
        throw new Error(`Non-image content-type: ${contentType}`);
      }

      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);
        writer.on('finish', () => {
          const stat = fs.statSync(destPath);
          if (stat.size === 0) {
            fs.unlinkSync(destPath);
            reject(new Error('Downloaded file is empty'));
          } else {
            resolve();
          }
        });
        writer.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });
    } catch (error) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Download images with concurrency control
 */
export async function downloadImages(
  images: Array<{ url: string; filename: string }>,
  destDir: string,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
    timeout?: number;
  } = {}
): Promise<{ completed: number; total: number }> {
  const { concurrency = CONCURRENCY, onProgress, timeout = 60000 } = options;

  fs.mkdirSync(destDir, { recursive: true });

  let completed = 0;
  const total = images.length;

  // Process in batches
  for (let i = 0; i < total; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    const promises = batch.map(async (img) => {
      const filePath = path.join(destDir, img.filename);
      try {
        await downloadSingleImage(img.url, filePath, timeout);
        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      } catch (error) {
        console.error(`Failed to download ${img.url}: ${(error as Error).message}`);
      }
    });

    await Promise.allSettled(promises);
  }

  return { completed, total };
}
