import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure downloads directory exists
const downloadsDir = join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

app.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !url.includes('youtube.com/watch?v=')) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video info to get the title
        const { stdout: info } = await execAsync(`python3 -m yt_dlp --dump-json "${url}"`);
        const { title } = JSON.parse(info);
        const safeTitle = title.replace(/[^\w\s]/gi, '');
        const outputPath = join(downloadsDir, `${safeTitle}.mp3`);

        // Download and convert to MP3
        await execAsync(`python3 -m yt_dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`);

        res.download(outputPath, `${safeTitle}.mp3`, (err) => {
            if (!err) {
                // Clean up the file after sending
                fs.unlink(outputPath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            }
        });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: err.message || 'Download failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
