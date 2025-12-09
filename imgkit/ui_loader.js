/**
 * ImgKit UI Loader
 * Dynamically loads ImgKit UI components and styles into the main application
 */

(function loadImgKitUI() {
  const fs = require("fs");
  const path = require("path");

  try {
    // Load HTML content
    const uiPath = path.join(__dirname, "imgkit", "index.html");
    const uiContent = fs.readFileSync(uiPath, "utf-8");

    // Extract and load CSS from head section
    const headMatch = uiContent.match(/<head[^>]*>([\s\S]*)<\/head>/i);
    if (headMatch && headMatch[1]) {
      const linkMatches = headMatch[1].matchAll(
        /<link[^>]*href=["']([^"']+)["'][^>]*>/gi
      );
      for (const match of linkMatches) {
        const href = match[1];
        const link = document.createElement("link");
        link.rel = "stylesheet";
        // Adjust path relative to imgkit folder
        link.href = href.startsWith("./")
          ? href.replace("./", "imgkit/")
          : `imgkit/${href}`;
        document.head.appendChild(link);
      }
    }

    // Extract body content
    const bodyMatch = uiContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      document.getElementById("imgkit-container").innerHTML = bodyMatch[1];
    } else {
      console.error("❌ Could not extract body content from ImgKit UI");
    }
  } catch (error) {
    console.error("❌ Failed to load ImgKit UI:", error);
  }
})();
