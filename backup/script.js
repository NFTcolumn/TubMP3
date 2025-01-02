document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('youtube-url');
    const downloadBtn = document.getElementById('download-btn');
    const API_URL = 'http://localhost:3000';

    downloadBtn.addEventListener('click', async () => {
        let url = input.value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }
        
        // Add https://www. if missing
        if (!url.startsWith('http')) {
            if (!url.startsWith('www.')) {
                if (!url.startsWith('youtube.com')) {
                    url = 'youtube.com/' + url;
                }
                url = 'www.' + url;
            }
            url = 'https://' + url;
        }

        try {
            downloadBtn.textContent = 'Converting...';
            downloadBtn.disabled = true;

            const response = await fetch(`${API_URL}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Download failed');
            }

            // Create a blob from the audio data
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Ask user for filename
            const filename = prompt('Enter filename for download:', 'audio.mp3');
            if (!filename) return; // User cancelled

            // Create a temporary link and trigger download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            input.value = '';

        } catch (err) {
            alert(err.message);
        } finally {
            downloadBtn.textContent = 'DOWNLOAD';
            downloadBtn.disabled = false;
        }
    });

    // Allow Enter key to trigger download
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            downloadBtn.click();
        }
    });
});
