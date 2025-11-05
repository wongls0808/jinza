# Video Setup Guide

## Videos for Brand Pages

The website requires video files for each brand's dedicated video page.

### Required Video Files:

**Location:** Place your video files in this `videos` folder

**Brand Video Files:**
1. `3trees-video.mp4` - 3TREES brand video
   - Source: https://youtu.be/UASlo1N7LJ8
   
2. `cks-video.mp4` - CKS brand video
   - Source: https://youtu.be/aWgGhJLRcOo
   
3. `chenyang-video.mp4` - Chenyang brand video
   - Source: https://v.qq.com/x/page/u32388gd54h.html
   
4. `oyh-video.mp4` - OYH brand video
   - Source: https://youtu.be/-R-FfWPJob0

### Video Specifications:

**Recommended Settings:**
- **Resolution:** 1920x1080 (Full HD) or 1280x720 (HD)
- **Aspect Ratio:** 16:9
- **Frame Rate:** 24-30 fps
- **Duration:** 30 seconds to 3 minutes recommended
- **File Size:** Keep under 50MB for optimal loading
- **Codec:** H.264 for MP4, VP9 for WebM

**Content Suggestions:**
- 3TREES: Product showcase, manufacturing process, environmental initiatives
- CKS: Application demonstrations, performance highlights
- Chenyang: Technology features, innovation highlights
- OYH: Professional use cases, project showcases

### How to Download Videos:

**For YouTube Videos (3TREES, CKS, OYH):**
1. Use a YouTube downloader:
   - 4K Video Downloader: https://www.4kdownload.com/
   - Online tools: y2mate.com, savefrom.net
   - Command line: youtube-dl or yt-dlp
2. Select MP4 format
3. Choose 1080p or 720p quality
4. Rename to correct filename

**For Tencent Video (Chenyang):**
1. Use compatible downloader or browser extension
2. Or screen recording if needed
3. Convert to MP4 if necessary

### Video Compression Tips:

To optimize video file size:
1. Use online tools like [HandBrake](https://handbrake.fr/) or [CloudConvert](https://cloudconvert.com/)
2. Reduce resolution if needed (720p is often sufficient)
3. Lower bitrate (2-4 Mbps for 1080p, 1-2 Mbps for 720p)
4. Use two-pass encoding for better quality at smaller sizes

### Features:

✅ **Autoplay** - Videos start automatically when page loads
✅ **Muted** - Required for autoplay to work on most browsers
✅ **Loop** - Videos repeat continuously
✅ **Controls** - Users can play, pause, seek, and adjust volume
✅ **Click to Play/Pause** - Click video to pause or resume
✅ **Responsive** - Adapts to all screen sizes
✅ **Mobile Optimized** - Works on mobile devices with playsinline

### Current Status:

⚠️ **Brand videos not yet added** - Please download and place video files here.

The pages are ready and will display videos once files are added to this folder.

### Testing:

After adding your video files:
1. Refresh the page (Ctrl+F5 / Cmd+Shift+R)
2. Video should autoplay immediately
3. Check browser console (F12) for any errors
4. Test on mobile devices for compatibility

### Troubleshooting:

**Video not playing?**
- Check file names match exactly: `hero-video.mp4` and `hero-video.webm`
- Verify files are in the `videos` folder
- Check file size (very large files may load slowly)
- Try in a different browser
- Check browser console for error messages

**Video quality issues?**
- Increase video bitrate during compression
- Use higher resolution source material
- Try different encoding settings

**Slow loading?**
- Compress video more aggressively
- Reduce resolution to 720p
- Use a CDN for hosting large video files
- Consider using a poster image while video loads

---

**Note:** For the best user experience, keep video files optimized and consider using a CDN for production deployment.
