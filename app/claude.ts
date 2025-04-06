const CLAUDE_API_KEY = "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";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

function extractJsonFromResponse(text: string): any {
    // Match a code block: ```json ... ```
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const rawJson = codeBlockMatch
      ? codeBlockMatch[1]
      : (text.match(/\{[\s\S]*\}/)?.[0] || null);
  
    if (!rawJson) {
      throw new Error("No valid JSON found in response.");
    }
  
    // Remove control characters from the raw JSON
    const sanitizedJson = rawJson.replace(/[\x00-\x1F\x7F]/g, "").trim();
  
    try {
      return JSON.parse(sanitizedJson);
    } catch (err) {
      console.error("Raw extracted text that failed to parse:", sanitizedJson);
      throw new Error("Extracted JSON is invalid.");
    }
  }
  
  export async function analyzeLandmarkImage(base64Image: string,
    landmarkName: string
  ): Promise<string> {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert and passionate tour guide AI.
                Tell me about ${landmarkName}, fun facts and historical details in 500 words.
                If no information is available, respond with "Sorry, no information on this landmark" and then provide fun facts or history in bullet points.
                Provide JUST a JSON object like this: 
                The structure must be:
                {
                  "text": string,
                  "characteristics": {
                    "ARCHITECTURE": ["CLASSICAL", "ROMANESQUE"],
                    "HISTORICAL_ERA": ["ANCIENT"],
                    "CULTURAL": ["EUROPEAN", "INDIGENOUS"],
                    "LANDMARK_TYPE": ["RELIGIOUS", "MILITARY"],
                    "VIBE": ["COLORFUL", "SYMMETRICAL"],
                    "EXPERIENCE_STYLE": ["PHOTO SPOT", "PANORAMIC VIEW"]
                  }
                }
                  Use ONLY the keywords from the list below to fill in the characteristics:
                  ARCHITECTURE:
                        - CLASSICAL
                        - ROMANESQUE
                        - GOTHIC
                        - BAROQUE
                        - VICTORIAN
                        - NEOCLASSICAL
                        - MODERNIST
                        - BRUTALIST
                        - POSTMODERN
                        - FUTURISTIC
                        - VERNACULAR
                        - TRADITIONAL
                        - MINIMALIST
                        - INDUSTRIAL
                        - ISLAMIC
                        - BYZANTINE
                        - MOORISH
                
                        HISTORICAL_ERA:
                        - ANCIENT (BEFORE 500 AD)
                        - MEDIEVAL (500–1500)
                        - RENAISSANCE (1500–1700)
                        - CLASSICAL REVIVAL (1700–1850)
                        - INDUSTRIAL ERA (1850–1900)
                        - MODERN (1900–1970)
                        - CONTEMPORARY (1970–PRESENT)
                
                        CULTURAL:
                        - EUROPEAN
                        - EASTERN EUROPEAN
                        - MIDDLE EASTERN
                        - NORTH AFRICAN
                        - SUB-SAHARAN AFRICAN
                        - EAST ASIAN
                        - SOUTH ASIAN
                        - SOUTHEAST ASIAN
                        - LATIN AMERICAN
                        - INDIGENOUS
                        - NORDIC
                        - SLAVIC
                
                        LANDMARK_TYPE:
                        - RELIGIOUS (CHURCH, MOSQUE, TEMPLE)
                        - MILITARY (FORT, CASTLE, BUNKER)
                        - GOVERNMENTAL (PALACE, PARLIAMENT)
                        - RESIDENTIAL (HISTORIC HOUSES, MANORS)
                        - COMMERCIAL (OLD MARKETS, SHOPS)
                        - BRIDGES
                        - TOWERS
                        - OBELISKS
                        - RUINS
                        - WALLS 
                        - GATES
                        - SCULPTURES
                        - MONUMENTS
                        - FOUNTAINS
                        - MUSEUMS
                        - PLAZAS
                        - TOWN SQUARES
                
                        VIBE:
                        - COLORFUL
                        - SYMMETRICAL
                        - DETAILED
                        - ORNATE
                        - MINIMALIST
                        - GRAND
                        - RUSTIC
                        - SHARP
                        - SOFT 
                        - OVERGROWN 
                        - REFLECTIVE (GLASS, WATER)
                        - NIGHT-LIT
                        - STREET ART
                
                        EXPERIENCE_STYLE:
                        - PHOTO SPOT
                        - PANORAMIC VIEW
                        - INSTAGRAMMABLE
                        - PEACEFUL
                        - CROWD FAVORITE
                        - HIDDEN GEM
                        - ROMANTIC
                        - FAMILY-FRIENDLY
                        - ADVENTURE INVOLVED
                `,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to analyze image");
    }
  
    try {
      console.log("Claude response:", data.content[0].text);
  
      // Fixing parsing by extracting the JSON from the text
      const jsonText = data.content[0].text.trim(); // Removing any unwanted characters
      const jsonData = extractJsonFromResponse(jsonText); 
  
      return JSON.stringify(jsonData, null, 2); // Return formatted JSON if needed
    } catch (error) {
      console.error("Claude raw output:", data.content[0].text);
      throw new Error("Invalid JSON response from Claude");
    }
  }
  
  