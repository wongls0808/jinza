# JINZA Website - Video Setup Guide

## Brand Video Files Needed

To complete the brand video pages, you need to add local video files for each brand in the `videos/` folder.

### Required Video Files:

1. **3TREES Brand (brand1.html)**
   - File names: `3trees-video.mp4` and/or `3trees-video.webm`
   - Location: `videos/3trees-video.mp4`
   - Online source: https://youtu.be/UASlo1N7LJ8

2. **CKS Brand (brand2.html)**
   - File names: `cks-video.mp4` and/or `cks-video.webm`
   - Location: `videos/cks-video.mp4`
   - Online source: https://youtu.be/aWgGhJLRcOo

3. **Chenyang Brand (brand3.html)**
   - File names: `chenyang-video.mp4` and/or `chenyang-video.webm`
   - Location: `videos/chenyang-video.mp4`
   - Online source: https://v.qq.com/x/page/u32388gd54h.html

4. **OYH Brand (brand4.html)**
   - File names: `oyh-video.mp4` and/or `oyh-video.webm`
   - Location: `videos/oyh-video.mp4`
   - Online source: https://youtu.be/-R-FfWPJob0

### Video Specifications:

- **Format**: MP4 (H.264) or WebM (VP9)
- **Resolution**: 1920x1080 (Full HD) recommended, or 1280x720 (HD)
- **Aspect Ratio**: 16:9
- **Duration**: 30 seconds to 3 minutes recommended
- **File Size**: Under 50MB for optimal loading (compress if needed)
- **Codec**: H.264 for MP4, VP9 for WebM
- **Audio**: AAC or MP3 codec

### How to Add Videos:

1. **Download videos from the online sources above**
   - Use online tools like: 4K Video Downloader, youtube-dl, or similar
   - For Tencent video, use compatible downloaders

2. **Create the videos folder**
   ```
   jinza web/
   └── videos/
   ```

3. **Convert and optimize videos** (optional but recommended)
   - Use tools like HandBrake or FFmpeg
   - Keep file size under 50MB for best performance
   - Maintain 16:9 aspect ratio

4. **Name the files correctly**
   - 3trees-video.mp4
   - cks-video.mp4
   - chenyang-video.mp4
   - oyh-video.mp4

5. **Place files in the videos folder**
   ```
   videos/
   ├── 3trees-video.mp4
   ├── cks-video.mp4
   ├── chenyang-video.mp4
   └── oyh-video.mp4
   ```

### Video Features:

- **Autoplay**: Videos will autoplay when page loads (muted)
- **Controls**: Full video controls visible to users
- **Loop**: Videos will loop continuously
- **Playsinline**: Works on mobile devices without fullscreen
- **Click to Play/Pause**: Click on video to pause or play

### Converting Videos:

**Using FFmpeg (command line):**
```bash
# Convert to MP4 with good quality and small size
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4

# Resize to 720p if needed
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -crf 23 -c:a aac output.mp4
```

**Using HandBrake (GUI):**
1. Open HandBrake
2. Select your video file
3. Choose "Fast 1080p30" or "Fast 720p30" preset
4. Click "Start Encode"

### Required Video Files:

1. **3TREES Brand (brand1.html)**
   - File names: `3trees-video.mp4` and/or `3trees-video.webm`
   - Location: `videos/3trees-video.mp4`

2. **CKS Brand (brand2.html)**
   - File names: `cks-video.mp4` and/or `cks-video.webm`
   - Location: `videos/cks-video.mp4`

3. **Chenyang Brand (brand3.html)**
   - File names: `chenyang-video.mp4` and/or `chenyang-video.webm`
   - Location: `videos/chenyang-video.mp4`

4. **OYH Brand (brand4.html)**
   - File names: `oyh-video.mp4` and/or `oyh-video.webm`
   - Location: `videos/oyh-video.mp4`

### Video Specifications:

- **Format**: MP4 (H.264) or WebM (VP9)
- **Resolution**: 1920x1080 (Full HD) recommended
- **Aspect Ratio**: 16:9
- **Duration**: 30 seconds to 3 minutes recommended
- **File Size**: Under 50MB for optimal loading
- **Codec**: H.264 for MP4, VP9 for WebM

### How to Add Videos:

1. Create a `videos` folder in the root directory if it doesn't exist
2. Place your video files in the `videos/` folder
3. Name them according to the list above
4. Both MP4 and WebM formats are supported for better browser compatibility

### Video Content Suggestions:

- **3TREES**: Product showcase, manufacturing process, environmental initiatives
- **CKS**: Application demonstrations, performance highlights
- **Chenyang**: Technology features, innovation highlights
- **OYH**: Professional use cases, project showcases

### Testing:

After adding videos, open each brand page:
- brand1.html
- brand2.html
- brand3.html
- brand4.html

Videos should autoplay (muted) and have controls for user interaction.

### Fallback:

If videos are not available yet:
- The pages will still work
- The video player will show a black background with "Your browser does not support the video tag"
- All other content and features remain functional

---

## Project Structure

```
jinza web/
├── index.html              # Main homepage
├── brand1.html             # 3TREES brand page
├── brand2.html             # CKS brand page
├── brand3.html             # Chenyang brand page
├── brand4.html             # OYH brand page
├── css/
│   ├── style.css           # Main homepage styles
│   └── brand-video.css     # Brand video pages styles
├── js/
│   ├── script.js           # Main homepage scripts
│   └── brand-video.js      # Brand video pages scripts
├── images/
│   ├── jinza-logo.png      # Main JINZA logo
│   ├── 3trees-logo.png     # 3TREES logo
│   ├── cks-logo.png        # CKS logo
│   ├── chenyang-logo.png   # Chenyang logo
│   └── oyh-logo.png        # OYH logo
└── videos/                 # ⚠️ Need to create and add videos
    ├── 3trees-video.mp4    # (Download and add)
    ├── cks-video.mp4       # (Download and add)
    ├── chenyang-video.mp4  # (Download and add)
    └── oyh-video.mp4       # (Download and add)
```

---

For questions or assistance, contact: jinza.sb@gmail.com
