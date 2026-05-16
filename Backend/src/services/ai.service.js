const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Define the raw JSON schema directly — skip zodToJsonSchema entirely
const interviewReportJsonSchema = {
  type: "object",
  properties: {
    matchScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "Score from 0-100 indicating how well the candidate matches the job requirements",
    },
    technicalQuestions: {
      type: "array",
      minItems: 8,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The technical interview question",
          },
          intention: {
            type: "string",
            description: "What the interviewer is testing with this question",
          },
          answer: {
            type: "string",
            description:
              "Detailed answer with approach, key points, and pitfalls",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      minItems: 5,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The behavioral interview question",
          },
          intention: {
            type: "string",
            description: "What competency the interviewer is evaluating",
          },
          answer: {
            type: "string",
            description: "STAR method answer with key points to highlight",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string", description: "The missing or weak skill" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          day: { type: "integer", description: "Day number from 1 to 7" },
          focus: {
            type: "string",
            description: "Main topic to study that day",
          },
          task: {
            type: "string",
            description: "Specific actionable tasks for the day",
          },
        },
        required: ["day", "focus", "task"],
      },
    },
    title: {
      type: "string",
      description: "A Role fit based on report",
    },
  },
  required: [
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title",
  ],
};

// Keep Zod only for runtime validation after receiving the response
const interviewReportZodSchema = z.object({
  matchScore: z.number().min(0).max(100),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      task: z.string(),
    }),
  ),
  title: z.string(),
});

async function generateInterviewReport({
  resume,
  jobDescription,
  selfDescription,
}) {
  const prompt = `
You are an expert technical recruiter and interview coach with 15+ years of experience.

Analyze the candidate's profile against the job description and generate a comprehensive interview preparation report.

## Resume
${resume}

## Job Description
${jobDescription}

## Candidate Self-Description
${selfDescription}

## Instructions

**matchScore**: Score 0–100 based on skills overlap, experience relevance, and seniority fit. Be realistic.

*technicalQuestions* (8–10 questions):
- Ask questions based ONLY on technologies in the resume and job description.
- Cover: core language/runtime concepts, database design, caching, system design, security, and performance.
- For each: write the actual question, explain why an interviewer would ask it, and give a thorough answer.

*behavioralQuestions* (5–6 questions):
- Tailor to the seniority level in the job description.
- Cover: collaboration, conflict resolution, ownership, learning agility, technical decision-making.
- For each: write the actual question, explain what the interviewer is evaluating, and give a STAR-method answer.

**skillGaps**:
- List every required or preferred skill from the job description that is weak or absent in the resume.
- Assign severity: high = required and missing, medium = preferred but partial, low = nice-to-have.

*preparationPlan* (exactly 7 days, day 1 through 7):
- Day 1–2: Focus on high-severity skill gaps.
- Day 3–5: Core technical topics and system design.
- Day 6: Behavioral prep and resume storytelling.
- Day 7: Mock interview and full revision.

**title**: Create a concise title summarizing the candidate's fit and key focus areas for preparation.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseJsonSchema: interviewReportJsonSchema, // ✅ raw schema, no zod wrapper
    },
  });

  // console.log("Raw AI response:", response.text); // Log the raw response for debugging
  // console.log(response.text)

  const data = JSON.parse(response.text);

  return data;
}
// using puppeteer

const generatePdfFromHtml = async (htmlContent) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// generating resume report with puppeteer

const generateResumePdf = async ({
  jobDescription,
  resume,
  selfDescription,
}) => {
  const resumePdfJsonSchema = {
    type: "object",
    properties: {
      html: {
        type: "string",
        description:
          "Complete HTML content of the resume, ready to convert to PDF with Puppeteer",
      },
    },
    required: ["html"],
  };

  const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: resumePdfJsonSchema,
    },
  });
  const jsonContent = JSON.parse(response.text);

  if (!jsonContent.html) {
    throw new Error("AI response did not include resume HTML.");
  }

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);
  return pdfBuffer;
};

module.exports = { generateInterviewReport, generateResumePdf };
