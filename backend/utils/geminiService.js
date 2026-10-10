import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const isConfigured = () => API_KEY && API_KEY !== "your_gemini_api_key_here";

const getModel = () => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({ model: MODEL });
};

// Try to pull a JSON object out of a model response that may contain markdown fences.
const safeJsonParse = (text) => {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    return null;
  }
};

/**
 * Analyze a CV against a job position and return a structured score.
 */
export const analyzeResume = async (cvText, position) => {
  if (!isConfigured()) {
    // Fallback so the app remains demonstrable without a key.
    return {
      score: 72,
      recommendation: "Average Candidate",
      summary:
        "[AI not configured] This is sample output. Add a GEMINI_API_KEY in backend/.env to enable real AI screening.",
      skills: ["Communication", "Teamwork", "Problem Solving"],
      configured: false,
    };
  }

  const prompt = `You are an expert technical recruiter. Analyze the following candidate CV for the position of "${position}".
Evaluate skills, years of experience, education, and overall fit.

Return ONLY a valid JSON object (no markdown, no commentary) with this exact shape:
{
  "score": <integer 0-100>,
  "recommendation": "Strong Candidate" | "Average Candidate" | "Not Recommended",
  "summary": "<2-3 sentence summary of strengths and gaps>",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"]
}

CV TEXT:
"""
${cvText.slice(0, 12000)}
"""`;

  const result = await getModel().generateContent(prompt);
  const text = result.response.text();
  const parsed = safeJsonParse(text);

  if (!parsed) {
    return {
      score: null,
      recommendation: "Average Candidate",
      summary: "AI returned an unstructured response. Raw output: " + text.slice(0, 400),
      skills: [],
      configured: true,
    };
  }

  // Normalize recommendation to allowed enum values
  const allowed = ["Strong Candidate", "Average Candidate", "Not Recommended"];
  if (!allowed.includes(parsed.recommendation)) {
    parsed.recommendation =
      parsed.score >= 75 ? "Strong Candidate" : parsed.score >= 50 ? "Average Candidate" : "Not Recommended";
  }

  return { ...parsed, configured: true };
};

/**
 * Generate interview questions for a position.
 */
export const generateInterviewQuestions = async (position, experience = "Mid-level") => {
  if (!isConfigured()) {
    return {
      configured: false,
      technical: [
        "[AI not configured] Explain a project relevant to this role.",
        "Walk through how you would debug a failing system.",
      ],
      behavioral: [
        "Tell me about a time you handled conflict on a team.",
        "Describe a deadline you nearly missed and what you did.",
      ],
      scenario: [
        "A production issue appears 10 minutes before a demo. What do you do?",
        "A stakeholder changes requirements mid-sprint. How do you respond?",
      ],
    };
  }

  const prompt = `Generate interview questions for a "${experience}" "${position}" candidate.
Return ONLY valid JSON (no markdown) with this exact shape:
{
  "technical": ["q1","q2","q3","q4","q5"],
  "behavioral": ["q1","q2","q3","q4"],
  "scenario": ["q1","q2","q3"]
}`;

  const result = await getModel().generateContent(prompt);
  const parsed = safeJsonParse(result.response.text());
  if (!parsed) {
    return { configured: true, technical: [], behavioral: [], scenario: [], error: "Could not parse AI response" };
  }
  return { ...parsed, configured: true };
};

/**
 * HR chatbot answer. `context` is a summary of live HR data assembled by the controller.
 */
export const chatWithHR = async (message, context) => {
  if (!isConfigured()) {
    return `[AI not configured] Add a GEMINI_API_KEY in backend/.env to enable the chatbot.\n\nHere is the current HR snapshot you asked about:\n${context}`;
  }

  const prompt = `You are "SmartHR Assistant", a helpful HR assistant for an internal HR system.
Answer the user's question using ONLY the live HR data provided below. Be concise and friendly.
If the data does not contain the answer, say so politely.

LIVE HR DATA:
${context}

USER QUESTION: ${message}`;

  const result = await getModel().generateContent(prompt);
  return result.response.text();
};

export const aiStatus = () => ({ configured: isConfigured(), model: MODEL });
