
import { GoogleGenAI } from "@google/genai";
import { Trip } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateDailySummary = async (trips: Trip[]): Promise<string> => {
  if (!API_KEY) {
    return "Error: Gemini API key is not configured. Please set the API_KEY environment variable.";
  }
  
  if (trips.length === 0) {
    return "No trips recorded for today. Nothing to summarize.";
  }

  const totalEarnings = trips.reduce((sum, trip) => sum + trip.earnings, 0).toFixed(2);
  const totalDistance = trips.reduce((sum, trip) => sum + trip.distanceKm, 0).toFixed(1);
  const totalTrips = trips.length;

  const prompt = `
    You are a helpful assistant for a logistics driver. Your task is to provide a concise, encouraging, and insightful summary of the driver's trips for the day.
    
    Here is the data for today's completed trips:
    - Total Trips: ${totalTrips}
    - Total Earnings: ₹${totalEarnings}
    - Total Distance Traveled: ${totalDistance} km

    Trip Details:
    ${trips.map((trip, index) => `
      - Trip ${index + 1}: 
        - Distance: ${trip.distanceKm.toFixed(1)} km
        - Earnings: ₹${trip.earnings.toFixed(2)}
        - Duration: ${trip.durationMinutes ? `${trip.durationMinutes.toFixed(0)} minutes` : 'N/A'}
    `).join('')}

    Based on this data, generate a summary. The summary should be:
    1.  **Brief and clear.**
    2.  **Positive and motivational.**
    3.  **Offer a simple insight.** For example, mention the most profitable trip or a potential pattern.
    4.  **Formatted in Markdown.** Use headings, bold text, and bullet points for readability.
    
    Example Output Format:
    
    ### Your Daily Performance Summary
    
    Great work today! You've had a productive day on the road.
    
    **Key Stats:**
    *   **Total Trips:** [Number]
    *   **Total Earnings:** ₹[Amount]
    *   **Total Distance:** [Distance] km
    
    **Insight of the Day:**
    [A brief, data-driven observation, e.g., "Your longest trip was also your most profitable, bringing in ₹[Amount]!"]
    
    Keep up the fantastic effort!
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    return "Sorry, I was unable to generate a summary at this time. Please check the console for errors.";
  }
};
