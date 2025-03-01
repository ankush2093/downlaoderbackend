import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Serve static files correctly (absolute path)
app.use("/downloads", express.static(DOWNLOAD_DIR)); 

app.get("/", (req, res) => {
  res.send("Hello G... I am Server And I Am Running of Youtube And Instagram Video Downloader");
});

// ✅ Ensure downloads folder exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ✅ API to download videos
app.post("/api/download", async (req, res) => {
  try {
    const { link, platform } = req.body;
    if (!link || !platform) return res.status(400).json({ error: "Missing parameters" });

    const filename = `video_${Date.now()}.mp4`;
    const filePath = path.join(DOWNLOAD_DIR, filename);

    let command = "";

    if (platform === "youtube") {
      command = `yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "${filePath}" ${link}`;
    } else if (platform === "instagram") {
      command = `yt-dlp -o "${filePath}" ${link}`;
    } else {
      return res.status(400).json({ error: "Invalid platform" });
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return res.status(500).json({ error: "Download failed" });
      }
      res.json({ fileUrl: `/downloads/${filename}` });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// // ✅ Serve and Auto-Delete File After Download
// app.get("/downloads/:filename", (req, res) => {
//   const filePath = path.join(DOWNLOAD_DIR, req.params.filename);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: "File not found" });
//   }

//   res.download(filePath, (err) => {
//     if (!err) {
//       // ✅ Delete the file after successful download
//       fs.unlink(filePath, (unlinkErr) => {
//         if (unlinkErr) console.error("Error deleting file:", unlinkErr);
//         else console.log(`Deleted: ${filePath}`);
//       });
//     }
//   });
// });

app.get("/downloads/:filename", (req, res) => {
  const filePath = path.join(DOWNLOAD_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath, (err) => {
    if (!err) {
      // ✅ Delay file deletion to avoid issues
      setTimeout(() => {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
          else console.log(`Deleted: ${filePath}`);
        });
      }, 10 * 1000); // Delete file after 10 seconds
    }
  });
});

// ✅ Use PORT from environment (for Render)
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
