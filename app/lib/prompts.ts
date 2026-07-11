// Prompt library for the Blackwork Tattoo MVP.
// Kept isolated so the style rules live in one place and are easy to tune.

export const BLACKWORK_SYSTEM_PROMPT =
  "You are a master blackwork tattoo artist and image generator. You ONLY produce blackwork tattoo art: pure solid black ink on skin/white, NO color whatsoever, NO grey shading gradients unless dotwork/stippling, high contrast, bold clean black linework, negative-space composition, strong silhouettes. Style references: traditional blackwork, ornamental, geometric, dotwork, black-fill. Never add color. Never produce photorealistic color art. Output must read as a real tattoo design.";

/** Prompt for generating a standalone blackwork flash design. */
export function generatePrompt(userText: string): string {
  return `Create a BLACKWORK TATTOO DESIGN of: ${userText}.

Requirements:
- 100% black ink, zero color, high contrast on clean white background.
- Bold solid black linework and black-fill; optional dotwork/stippling for texture.
- Centered, isolated design (flash-sheet style), no background scene, no skin.
- Tattoo-ready: clean edges, balanced negative space, cohesive blackwork style.
Return the image.`;
}

/** Prompt for compositing a blackwork tattoo onto an attached photo of a person. */
export function tryonPrompt(userText: string): string {
  return `Edit the ATTACHED PHOTO of a real person. Add a BLACKWORK TATTOO of: ${userText}, composed naturally onto the visible skin (e.g. forearm/arm) in the photo.

Strict rules:
- PRESERVE the person exactly: same body, same skin tone, same pose, same lighting, same background. Do NOT change identity, limbs, or the scene.
- The tattoo must be pure solid BLACK ink, NO color, high contrast, blackwork style (bold linework, black-fill, optional dotwork).
- Wrap/curve the design to follow the skin's contour and perspective realistically.
- Match the photo's lighting and shadows so the tattoo looks freshly applied on skin.
- Only ADD the tattoo; change nothing else. Return the edited photo.`;
}
