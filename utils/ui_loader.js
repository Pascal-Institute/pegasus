"use strict";
/**
 * ImgKit UI Loader
 * Dynamically loads ImgKit UI components and styles into the main application
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
(function loadImgKitUI() {
    try {
        // Load HTML content
        // Use process.cwd() to get the application root directory
        const uiPath = path.join(process.cwd(), "components", "imgpanel.html");
        const uiContent = fs.readFileSync(uiPath, "utf-8");
        // Extract and load CSS from head section
        const headMatch = uiContent.match(/<head[^>]*>([\s\S]*)<\/head>/i);
        if (headMatch && headMatch[1]) {
            const linkMatches = headMatch[1].matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi);
            for (const match of linkMatches) {
                const href = match[1];
                const link = document.createElement("link");
                link.rel = "stylesheet";
                // Use href as-is since CSS is now in css/ folder
                link.href = href.startsWith("./") ? href : `./${href}`;
                document.head.appendChild(link);
            }
        }
        // Extract body content
        const bodyMatch = uiContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
            const container = document.getElementById("imgkit-container");
            if (container) {
                container.innerHTML = bodyMatch[1];
            }
        }
        else {
            console.error("❌ Could not extract body content from ImgKit UI");
        }
    }
    catch (error) {
        console.error("❌ Failed to load ImgKit UI:", error);
    }
})();
//# sourceMappingURL=ui_loader.js.map