// --- Z-Image (fal.ai) Image Generation Service ---

// Default image size constant
const DEFAULT_IMAGE_SIZE = { width: 1024, height: 576 }; // 16:9 Landscape for game scenes

export interface ZImageTextToImageOptions {
    image_size?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9" | { width: number; height: number };
    num_inference_steps?: number; // Default 4 for turbo
    seed?: number;
    guidance_scale?: number;
    num_images?: number; // Number of images to generate (1-4)
    enable_safety_checker?: boolean;
}

interface FalResultResponse {
    images: Array<{
        url: string;
        width: number;
        height: number;
        content_type: string;
    }>;
    timings?: {
        inference: number;
    };
    seed?: number;
    has_nsfw_concepts?: boolean[];
    prompt?: string;
}

// --- API Calls ---

// Sync API
const FAL_SYNC_API_BASE = "https://fal.run";

/**
 * Convert image URL to base64 (browser compatible)
 */
async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Generate images using Z-Image Text-to-Image API (synchronous)
 * @param prompt - Description of the image to generate
 * @param options - Optional configuration
 * @returns Array of base64 image strings, or null if generation fails
 */
export const generateZTextToImage = async (
    prompt: string,
    options: ZImageTextToImageOptions = {}
): Promise<string[] | null> => {
    const {
        image_size = DEFAULT_IMAGE_SIZE,
        num_inference_steps = 4,
        guidance_scale = 1,
        num_images = 1,
        enable_safety_checker = true,
        seed
    } = options;

    // Use process.env.FAL_KEY or fallback to the key provided in .env content
    const apiKey = process.env.FAL_KEY;
    
    if (!apiKey) {
        console.error("[ZImage] API key not configured (FAL_KEY)");
        return null;
    }

    const endpoint = "fal-ai/z-image/turbo";

    const requestBody: any = {
        prompt,
        image_size,
        num_inference_steps,
        guidance_scale,
        num_images: Math.min(Math.max(num_images, 1), 4),
        enable_safety_checker,
        sync_mode: true  // 返回 data URI 格式，包含 base64
    };

    if (seed !== undefined) {
        requestBody.seed = seed;
    }

    try {
        console.log(`[ZImage] Generating ${num_images} image(s) via text-to-image (sync)`);

        const response = await fetch(`${FAL_SYNC_API_BASE}/${endpoint}`, {
            method: "POST",
            headers: {
                "Authorization": `Key ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Z-Image API error: ${response.status} - ${errorText}`);
        }

        const result: FalResultResponse = await response.json();

        if (!result.images || result.images.length === 0) {
            console.warn("[ZImage] No images returned in response");
            return null;
        }

        // sync_mode=true 时，url 是 data URI 格式，直接提取 base64
        const base64Images: string[] = [];
        for (const img of result.images) {
            if (img.url.startsWith('data:')) {
                // data URI 格式: data:image/png;base64,xxxxx
                const base64 = img.url.split(',')[1];
                base64Images.push(base64);
            } else {
                // 如果还是普通 URL，则转换
                const base64 = await urlToBase64(img.url);
                base64Images.push(base64);
            }
        }

        console.log(`[ZImage] Successfully generated ${base64Images.length} image(s)`);
        return base64Images;
    } catch (e) {
        console.error("[ZImage] Text-to-image generation failed:", e);
        return null;
    }
};

/**
 * Generate a game scene image with specific pixel art style
 */
export const generateSceneImage = async (prompt: string): Promise<string> => {
    const pixelPrompt = `High quality 16-bit pixel art style. ${prompt}. NO TEXT. NO BUBBLES. Warm festive palette.`;
    try {
        const images = await generateZTextToImage(pixelPrompt, {
            image_size: "landscape_16_9",
            num_inference_steps: 4,
            enable_safety_checker: true
        });
        
        if (images && images.length > 0) {
            return `data:image/jpeg;base64,${images[0]}`;
        }
    } catch (e) {
        console.error("Fal.ai generation failed", e);
    }
    // Fallback image
    return "https://picsum.photos/800/600?blur";
};
