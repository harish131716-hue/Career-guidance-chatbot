import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, X, Wifi, HardDrive, Mic, Sun, Moon, Download } from "lucide-react";
import html2pdf from "html2pdf.js";

export default function App() {
  const [role, setRole] = useState(null);
  const [aiMode, setAiMode] = useState("local");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [listening, setListening] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [course1, setCourse1] = useState("");
  const [course2, setCourse2] = useState("");

  const [showEligibility, setShowEligibility] = useState(false);
  const [marks, setMarks] = useState("");
  const [stream, setStream] = useState("");
  const [location, setLocation] = useState("");
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [showAdmissionGuide, setShowAdmissionGuide] = useState(false);
  const [guideStream, setGuideStream] = useState("");
  const [guideResult, setGuideResult] = useState(null);
  const [guideLoading, setGuideLoading] = useState(false);

  const [showDayInLife, setShowDayInLife] = useState(false);
  const [dayInLifeCareer, setDayInLifeCareer] = useState("");
  const [dayInLifeResult, setDayInLifeResult] = useState(null);
  const [dayInLifeLoading, setDayInLifeLoading] = useState(false);

  const [showHelpline, setShowHelpline] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);

  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const [criteria, setCriteria] = useState({
    salary: true,
    jobDemand: true,
    duration: true,
    skills: true,
    scope: true,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (role) {
      setMessages([
        {
          role: "assistant",
          content:
            role === "student"
              ? "Hi 👋 Tell me your interests and I'll connect them to career paths."
              : "Hello 👋 Tell me your child's interests and I'll suggest stable and promising career options.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const detectCareerIntent = (text) => {
    const lower = text.toLowerCase();

    const keywords = [
      "career",
      "become",
      "pursue",
      "study",
      "engineering",
      "ai",
      "data",
      "doctor",
      "medical",
      "medicine",
      "business",
      "law",
      "finance",
      "design",
      "developer",
      "science",
      "college",
      "degree",
      "job",
      "profession",
      "interest",
      "interested",
      "future",
      "like",
      "love",
    ];

    return keywords.some((k) => lower.includes(k));
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    if (listening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage === "hi" ? "hi-IN" : selectedLanguage === "ta" ? "ta-IN" : "en-US";
    recognition.continuous = false;

    setListening(true);

    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
  };

  const callAI = async (prompt, maxTokens = 150, stopTokens) => {
    if (aiMode === "local") {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "phi",
          prompt,
          stream: false,
          options: {
            temperature: 0.5,
            num_predict: maxTokens,
            ...(stopTokens ? { stop: stopTokens } : {}),
          },
        }),
      });

      const data = await res.json();
      return data.response?.trim() || "";
    } else {
      const res = await fetch("http://localhost:5000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      return data.response || "";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();

    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date().toLocaleTimeString() },
    ]);

    setChatLoading(true);

    try {
      const tone =
        role === "parent"
          ? `Respond in a parent-focused tone. Mention stability, salary range and demand.`
          : `Respond in a friendly student-focused tone. Mention skills and growth path.`;

      const conversationHistory = messages
        .slice(-5)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

      const mainPrompt = `
You are a professional career counselor.

IMPORTANT RULES:
- Always relate any topic to careers.
- Never refuse.
- If the user asks about colleges or universities, suggest 3-5 relevant institutions.
- Never say "not related".
- Convert hobbies or interests into career skills and paths.
- Keep answer concise (4-6 sentences).

Conversation so far:
${conversationHistory}

${tone}

User: ${userMessage}

Career Guidance:
${selectedLanguage !== "en" ? `\n\nRespond in ${selectedLanguage === "hi" ? "Hindi" : "Tamil"} language.` : ""}
`;

      const rawResponse = await callAI(mainPrompt, 500);

      const cleanedResponse = rawResponse
        .replace(/I'm sorry.*$/gi, "")
        .replace(/Consider the following scenario.*$/gis, "")
        .trim();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanedResponse, timestamp: new Date().toLocaleTimeString() },
      ]);

      setChatLoading(false);

      if (detectCareerIntent(userMessage)) {
        setShowRoadmap(true);
        setRoadmapLoading(true);
        setRoadmap(null);

        const roadmapPrompt = `
Create a clear career roadmap.

Format:

🎯 Career Goal
(one sentence)

📚 Key Subjects
- subject
- subject
- subject

🛠 Important Skills
- skill
- skill
- skill

🎓 Degree Options
- degree
- degree

📅 4-Year Plan

Year 1:
Year 2:
Year 3:
Year 4:

Career Interest: ${userMessage}
${selectedLanguage !== "en" ? `\n\nProvide the response in ${selectedLanguage === "hi" ? "Hindi" : "Tamil"} language.` : ""}
`;

        const roadmapText = await callAI(roadmapPrompt, 1000);

        setRoadmap(roadmapText?.trim() || "⚠️ Roadmap generation failed.");
        setRoadmapLoading(false);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection error. Please try again.", timestamp: new Date().toLocaleTimeString() },
      ]);

      setChatLoading(false);
      setRoadmapLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!course1.trim() || !course2.trim()) return;

    setCompareLoading(true);
    setCompareResults(null);

    const criteriaList = Object.entries(criteria)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");

    const prompt = `
You are a career counselor. Compare these two courses strictly based on the requested criteria.

Course A: ${course1}
Course B: ${course2}
Criteria: ${criteriaList}

Return ONLY this exact format:

📊 COMPARISON: ${course1} vs ${course2}

💰 Salary
${course1}: [avg salary range]
${course2}: [avg salary range]

📈 Job Demand
${course1}: [demand level + reason]
${course2}: [demand level + reason]

⏱ Duration
${course1}: [typical duration]
${course2}: [typical duration]

🛠 Key Skills
${course1}: [top 3 skills]
${course2}: [top 3 skills]

🌍 Future Scope
${course1}: [scope summary]
${course2}: [scope summary]

✅ Better Choice: [which is better and why]
`;

    try {
      const result = await callAI(prompt, 800);
      setCompareResults(result.trim());
    } catch {
      setCompareResults("⚠️ Error generating comparison.");
    }

    setCompareLoading(false);
  };

  const handleEligibility = async () => {
    if (!marks.trim() || !stream || !location) return;

    // only allow online mode
    if (aiMode !== "online") {
      setEligibilityResult("⚠️ Eligibility Check works only in Online AI mode.");
      return;
    }

    setEligibilityLoading(true);
    setEligibilityResult(null);

    const prompt = `
You are an expert college admission counselor.

Student details:
Marks/Cutoff: ${marks}
Preferred Stream: ${stream}
Study Location: ${location}

IMPORTANT:
- Do NOT write introductions.
- Be concise but informative.

Return EXACTLY in this format:

🎓 Eligible Courses
1. Course name – short reason
2. Course name – short reason
3. Course name – short reason

🏫 Suggested Colleges
1. College name – city – approx yearly fees
2. College name – city – approx yearly fees
3. College name – city – approx yearly fees

📊 Admission Chances
Explain briefly if the student has high / moderate / competitive chances.

📝 Entrance Exams
List relevant exams.
${selectedLanguage !== "en" ? `\n\nProvide the entire response in ${selectedLanguage === "hi" ? "Hindi" : "Tamil"} language.` : ""}
`;

    try {
      const result = await callAI(prompt, 1200);
      setEligibilityResult(result.trim());
    } catch {
      setEligibilityResult("⚠️ Error generating eligibility check.");
    }

    setEligibilityLoading(false);
  };

  const handleAdmissionGuide = async () => {
    if (!guideStream) return;

    setGuideLoading(true);
    setGuideResult(null);

    // Fixed admission guides for each stream and language
    const guides = {
      Engineering: {
        en: `📋 ADMISSION GUIDE FOR ENGINEERING STREAM

🎯 Step 1: Career Counseling
Meet with a career counselor to discuss your interests in engineering branches (CSE, Mechanical, Civil, Electrical, etc.). They will assess your aptitude, help identify suitable engineering fields, and guide you on career prospects and job opportunities in each specialization.

📝 Step 2: Document Preparation
Gather: 10th & 12th mark sheets, entrance exam scorecards, caste certificate (if applicable), income certificate, passport-size photos, and address proof. Ensure all documents are attested and keep photocopies ready.

🏫 Step 3: College Selection
Research colleges based on NIRF rankings, placement records, faculty quality, and infrastructure. Consider location preferences, fees, and branch availability. Visit college websites and attend counseling sessions to understand admission criteria.

📊 Step 4: Entrance Exams
JEE Main & JEE Advanced for IITs/NITs, state-level exams like MHT-CET, KCET, WBJEE. Prepare through coaching, online resources, and mock tests. Focus on Physics, Chemistry, Mathematics with equal emphasis.

💰 Step 5: Application Process
Apply through official websites or counseling portals. Pay application fees (₹500-₹2000). Fill forms carefully with accurate personal and academic details. Keep track of important deadlines for different exam phases.

🎓 Step 6: Admission Process
Participate in centralized counseling (JoSAA for IITs/NITs). Choose colleges and branches based on your rank and preferences. Attend document verification rounds and medical check-ups as required.

✅ Step 7: Final Steps
Pay admission fees, complete hostel formalities if needed, attend orientation programs, and begin your engineering journey with the right mindset and preparation.

⚠️ Important Tips
• Start preparation early (Class 11)
• Focus on conceptual understanding over rote learning
• Practice regularly with previous years' papers
• Stay updated with exam pattern changes
• Consider backup options and state colleges`,

        hi: `📋 इंजीनियरिंग स्ट्रीम के लिए प्रवेश मार्गदर्शिका

🎯 चरण 1: करियर काउंसलिंग
एक करियर काउंसलर से मिलें और इंजीनियरिंग शाखाओं (सीएसई, मैकेनिकल, सिविल, इलेक्ट्रिकल, आदि) में अपनी रुचि पर चर्चा करें। वे आपकी योग्यता का आकलन करेंगे, उपयुक्त इंजीनियरिंग क्षेत्रों की पहचान करेंगे, और प्रत्येक विशेषज्ञता में करियर के अवसरों और नौकरी के अवसरों पर मार्गदर्शन देंगे।

📝 चरण 2: दस्तावेज तैयारी
एकत्र करें: 10वीं और 12वीं की मार्कशीट, प्रवेश परीक्षा स्कोरकार्ड, जाति प्रमाणपत्र (यदि लागू हो), आय प्रमाणपत्र, पासपोर्ट साइज फोटो, और पता प्रमाण। सुनिश्चित करें कि सभी दस्तावेज प्रमाणित हैं और फोटोकॉपी तैयार रखें।

🏫 चरण 3: कॉलेज चयन
एनआईआरएफ रैंकिंग, प्लेसमेंट रिकॉर्ड, फैकल्टी गुणवत्ता और बुनियादी ढांचे के आधार पर कॉलेजों का शोध करें। स्थान वरीयताओं, फीस और शाखा उपलब्धता पर विचार करें। कॉलेज वेबसाइटों पर जाएं और प्रवेश मानदंडों को समझने के लिए काउंसलिंग सत्रों में भाग लें।

📊 चरण 4: प्रवेश परीक्षाएं
आईआईटी/एनआईटी के लिए जेईई मेन और जेईई एडवांस्ड, राज्य स्तर की परीक्षाएं जैसे एमएचटी-सीईटी, केसीईटी, डब्ल्यूबीजेईई। कोचिंग, ऑनलाइन संसाधनों और मॉक टेस्ट के माध्यम से तैयारी करें। भौतिकी, रसायन विज्ञान और गणित पर समान जोर दें।

💰 चरण 5: आवेदन प्रक्रिया
आधिकारिक वेबसाइटों या काउंसलिंग पोर्टलों के माध्यम से आवेदन करें। आवेदन शुल्क (₹500-₹2000) का भुगतान करें। सटीक व्यक्तिगत और शैक्षणिक विवरण के साथ फॉर्म भरें। विभिन्न परीक्षा चरणों के लिए महत्वपूर्ण समय सीमा का ट्रैक रखें।

🎓 चरण 6: प्रवेश प्रक्रिया
केंद्रीकृत काउंसलिंग (आईआईटी/एनआईटी के लिए जोसाआ) में भाग लें। अपनी रैंक और वरीयताओं के आधार पर कॉलेज और शाखाएं चुनें। आवश्यकतानुसार दस्तावेज सत्यापन दौरों और चिकित्सा जांच में भाग लें।

✅ चरण 7: अंतिम चरण
प्रवेश शुल्क का भुगतान करें, यदि आवश्यक हो तो हॉस्टल औपचारिकताएं पूरी करें, ओरिएंटेशन कार्यक्रमों में भाग लें, और सही मानसिकता और तैयारी के साथ अपनी इंजीनियरिंग यात्रा शुरू करें।

⚠️ महत्वपूर्ण सुझाव
• जल्दी तैयारी शुरू करें (कक्षा 11)
• रटने की बजाय अवधारणात्मक समझ पर ध्यान दें
• पिछले वर्षों के पेपर के साथ नियमित अभ्यास करें
• परीक्षा पैटर्न परिवर्तनों से अपडेट रहें
• बैकअप विकल्पों और राज्य कॉलेजों पर विचार करें`,

        ta: `📋 இன்ஜினியரிங் ஸ்ட்ரீமுக்கான சேர்க்கை வழிகாட்டி

🎯 படி 1: தொழில் ஆலோசனை
இன்ஜினியரிங் கிளைகளில் (சிஎஸ்இ, மெக்கானிக்கல், சிவில், எலக்ட்ரிக்கல் போன்றவை) உங்கள் ஆர்வத்தைப் பற்றி ஒரு தொழில் ஆலோசகருடன் கலந்துரையாடுங்கள். அவர்கள் உங்கள் திறனை மதிப்பிடுவார்கள், பொருத்தமான இன்ஜினியரிங் துறைகளை அடையாளம் காண்பார்கள், ஒவ்வொரு சிறப்புத்துறையிலும் தொழில் வாய்ப்புகள் மற்றும் வேலை வாய்ப்புகளைப் பற்றிய வழிகாட்டுதலை வழங்குவார்கள்.

📝 படி 2: ஆவண தயாரிப்பு
சேகரிக்கவும்: 10வது மற்றும் 12வது மதிப்பெண் தாள்கள், நுழைவுத் தேர்வு ஸ்கோர்கார்டுகள், சாதி சான்றிதழ் (பொருந்தினால்), வருமான சான்றிதழ், கடவுச்சீட்டு அளவு புகைப்படங்கள் மற்றும் முகவரி ஆதாரம். எல்லா ஆவணங்களும் சான்றளிக்கப்பட்டிருப்பதை உறுதிசெய்து, நகல்களைத் தயார்படுத்தி வையுங்கள்.

🏫 படி 3: கல்லூரி தேர்வு
நிர்ப் தரவரிசை, வேலைவாய்ப்பு பதிவுகள், பாட்டாளர்களின் தரம் மற்றும் உள்கட்டமைப்பின் அடிப்படையில் கல்லூரிகளை ஆராயுங்கள். இட விருப்பங்கள், கட்டணம் மற்றும் கிளை கிடைப்பை கருத்தில் கொள்ளுங்கள். கல்லூரி வலைத்தளங்களைப் பார்வையிடுங்கள் மற்றும் சேர்க்கை அளவுகோல்களைப் புரிந்துகொள்ள கவுன்சலிங் அமர்வுகளில் கலந்துகொள்ளுங்கள்.

📊 படி 4: நுழைவுத் தேர்வுகள்
ஐஐடிகள்/நிட்களுக்கு ஜேஇஇ மெயின் மற்றும் ஜேஇஇ அட்வான்ஸ்ட், மாநில அளவு தேர்வுகள் போன்ற எம்எச்டி-சிஇடி, கேசிடி, டபிள்யூபிஜேஇஇ. பயிற்சி, ஆன்லைன் வளங்கள் மற்றும் போலித்தேர்வுகள் மூலம் தயார்படுங்கள். இயற்பியல், வேதியியல் மற்றும் கணிதத்தில் சம அளவு கவனம் செலுத்துங்கள்.

💰 படி 5: விண்ணப்ப செயல்முறை
அதிகாரப்பூர்வ வலைத்தளங்கள் அல்லது கவுன்சலிங் போர்ட்டல்கள் வழியாக விண்ணப்பிக்கவும். விண்ணப்பக் கட்டணம் (₹500-₹2000) செலுத்தவும். துல்லியமான தனிப்பட்ட மற்றும் கல்வி விவரங்களுடன் படிவங்களை நிரப்பவும். வெவ்வேறு தேர்வு கட்டங்களுக்கான முக்கிய காலக்கெடுவை கண்காணிக்கவும்.

🎓 படி 6: சேர்க்கை செயல்முறை
மையப்படுத்தப்பட்ட கவுன்சலிங் (ஐஐடிகள்/நிட்களுக்கு ஜோசாஆ) இல் பங்கேற்கவும். உங்கள் தரவரிசை மற்றும் விருப்பங்களின் அடிப்படையில் கல்லூரிகள் மற்றும் கிளைகளைத் தேர்ந்தெடுக்கவும். தேவைக்கேற்ப ஆவண சரிபார்ப்பு சுற்றுகள் மற்றும் மருத்துவ பரிசோதனைகளில் கலந்துகொள்ளவும்.

✅ படி 7: இறுதி படிகள்
சேர்க்கை கட்டணம் செலுத்தவும், தேவைப்பட்டால் ஹாஸ்டல் நடைமுறைகளை முடிக்கவும், அறிமுக நிகழ்ச்சிகளில் கலந்துகொள்ளவும், சரியான மனநிலை மற்றும் தயார்ப்புடன் உங்கள் இன்ஜினியரிங் பயணத்தைத் தொடங்குங்கள்.

⚠️ முக்கிய குறிப்புகள்
• ஆரம்பத்தில் தயார்ப்பைத் தொடங்குங்கள் (வகுப்பு 11)
• மனப்பாடம் செய்வதை விட கருத்து புரிதலை மையப்படுத்துங்கள்
• முந்தைய ஆண்டுகளின் காகிதங்களுடன் தொடர்ந்து பயிற்சி செய்யுங்கள்
• தேர்வு முறை மாற்றங்களைப் புதுப்பித்து வைத்திருங்கள்
• காப்பு விருப்பங்கள் மற்றும் மாநில கல்லூரிகளைக் கருத்தில் கொள்ளுங்கள்`
      },

      Medical: {
        en: `📋 ADMISSION GUIDE FOR MEDICAL STREAM

🎯 Step 1: Career Counseling
Consult with medical career counselors to understand different medical fields (MBBS, BDS, Nursing, Pharmacy, etc.). They will evaluate your interest in patient care, research, or healthcare administration and guide you towards suitable medical careers.

📝 Step 2: Document Preparation
Collect: 10th & 12th mark sheets (with PCB subjects), NEET scorecard, caste/income certificates, birth certificate, passport photos, and address proof. Ensure PCB marks are above 50% and all documents are properly attested.

🏫 Step 3: College Selection
Choose medical colleges based on MCI recognition, infrastructure, hospital affiliations, and faculty expertise. Consider government vs private colleges, location, and course fees. Research through official websites and medical council listings.

📊 Step 4: Entrance Exams
NEET-UG is mandatory for MBBS/BDS admission. Prepare through coaching institutes, self-study, and mock tests. Focus on Biology (Botany & Zoology), Physics, and Chemistry. Practice MCQs and time management.

💰 Step 5: Application Process
Apply through NEET counseling (MCC for AIQ, state counseling for state quota). Pay counseling fees (₹1000-₹5000). Register with accurate details and upload required documents online.

🎓 Step 6: Admission Process
Participate in counseling rounds based on NEET ranks. Choose colleges and courses according to merit and preferences. Attend document verification and medical fitness tests.

✅ Step 7: Final Steps
Complete admission formalities, pay tuition fees, arrange for hostel accommodation if needed, and prepare for the rigorous medical curriculum with dedication and commitment.

⚠️ Important Tips
• Maintain excellent PCB marks (above 60% preferred)
• Start NEET preparation early (Class 11)
• Focus on conceptual clarity and regular practice
• Stay updated with medical council regulations
• Consider alternative medical courses if NEET scores are moderate`,

        hi: `📋 मेडिकल स्ट्रीम के लिए प्रवेश मार्गदर्शिका

🎯 चरण 1: करियर काउंसलिंग
विभिन्न मेडिकल क्षेत्रों (एमबीबीएस, बीडीएस, नर्सिंग, फार्मेसी, आदि) को समझने के लिए मेडिकल करियर काउंसलर से सलाह लें। वे रोगी देखभाल, अनुसंधान या स्वास्थ्य प्रशासन में आपकी रुचि का मूल्यांकन करेंगे और उपयुक्त मेडिकल करियर की ओर मार्गदर्शन देंगे।

📝 चरण 2: दस्तावेज तैयारी
एकत्र करें: 10वीं और 12वीं की मार्कशीट (पीसीबी विषयों के साथ), नीट स्कोरकार्ड, जाति/आय प्रमाणपत्र, जन्म प्रमाणपत्र, पासपोर्ट फोटो, और पता प्रमाण। सुनिश्चित करें कि पीसीबी अंक 50% से ऊपर हैं और सभी दस्तावेज ठीक से प्रमाणित हैं।

🏫 चरण 3: कॉलेज चयन
एमसीआई मान्यता, बुनियादी ढांचा, अस्पताल संबद्धता और फैकल्टी विशेषज्ञता के आधार पर मेडिकल कॉलेज चुनें। सरकारी बनाम निजी कॉलेज, स्थान और कोर्स फीस पर विचार करें। आधिकारिक वेबसाइटों और मेडिकल काउंसिल लिस्टिंग के माध्यम से शोध करें।

📊 चरण 4: प्रवेश परीक्षाएं
एमबीबीएस/बीडीएस प्रवेश के लिए नीट-यूजी अनिवार्य है। कोचिंग संस्थानों, स्व-अध्ययन और मॉक टेस्ट के माध्यम से तैयारी करें। जीव विज्ञान (वनस्पति विज्ञान और प्राणी विज्ञान), भौतिकी और रसायन विज्ञान पर ध्यान दें। एमसीक्यू और समय प्रबंधन का अभ्यास करें।

💰 चरण 5: आवेदन प्रक्रिया
नीट काउंसलिंग (एआईक्यू के लिए एमसीसी, राज्य कोटा के लिए राज्य काउंसलिंग) के माध्यम से आवेदन करें। काउंसलिंग शुल्क (₹1000-₹5000) का भुगतान करें। सटीक विवरण के साथ पंजीकरण करें और आवश्यक दस्तावेज ऑनलाइन अपलोड करें।

🎓 चरण 6: प्रवेश प्रक्रिया
नीट रैंक के आधार पर काउंसलिंग दौरों में भाग लें। मेरिट और वरीयताओं के अनुसार कॉलेज और कोर्स चुनें। दस्तावेज सत्यापन और मेडिकल फिटनेस टेस्ट में भाग लें।

✅ चरण 7: अंतिम चरण
प्रवेश औपचारिकताएं पूरी करें, ट्यूशन फीस का भुगतान करें, यदि आवश्यक हो तो हॉस्टल आवास की व्यवस्था करें, और समर्पण और प्रतिबद्धता के साथ कठोर मेडिकल पाठ्यक्रम के लिए तैयार हों।

⚠️ महत्वपूर्ण सुझाव
• उत्कृष्ट पीसीबी अंक बनाए रखें (60% से ऊपर पसंदीदा)
• नीट तैयारी जल्दी शुरू करें (कक्षा 11)
• अवधारणात्मक स्पष्टता और नियमित अभ्यास पर ध्यान दें
• मेडिकल काउंसिल नियमों से अपडेट रहें
• यदि नीट स्कोर मध्यम हैं तो वैकल्पिक मेडिकल कोर्स पर विचार करें`,

        ta: `📋 மருத்துவ ஸ்ட்ரீமுக்கான சேர்க்கை வழிகாட்டி

🎯 படி 1: தொழில் ஆலோசனை
வெவ்வேறு மருத்துவத் துறைகளைப் புரிந்துகொள்ள (எம்பிபிஎஸ், பிடிஎஸ், நர்சிங், ஃபார்மசி போன்றவை) மருத்துவத் தொழில் ஆலோசகரிடம் ஆலோசனை பெறுங்கள். அவர்கள் நோயாளி பராமரிப்பு, ஆராய்ச்சி அல்லது சுகாதார நிர்வாகத்தில் உங்கள் ஆர்வத்தை மதிப்பிடுவார்கள் மற்றும் பொருத்தமான மருத்துவத் தொழில்களுக்கு வழிகாட்டுவார்கள்.

📝 படி 2: ஆவண தயாரிப்பு
சேகரிக்கவும்: 10வது மற்றும் 12வது மதிப்பெண் தாள்கள் (பிசிபி பாடங்களுடன்), நீட் ஸ்கோர்கார்ட், சாதி/வருமான சான்றிதழ்கள், பிறப்பு சான்றிதழ், கடவுச்சீட்டு புகைப்படங்கள் மற்றும் முகவரி ஆதாரம். பிசிபி மதிப்பெண்கள் 50%க்கு மேல் இருப்பதை உறுதிசெய்து, எல்லா ஆவணங்களும் சரியாக சான்றளிக்கப்பட்டிருப்பதை உறுதிசெய்யுங்கள்.

🏫 படி 3: கல்லூரி தேர்வு
எம்சிஐ அங்கீகாரம், உள்கட்டமைப்பு, மருத்துவமனை தொடர்புகள் மற்றும் பாட்டாளர்களின் நிபுணத்துவத்தின் அடிப்படையில் மருத்துவக் கல்லூரிகளைத் தேர்ந்தெடுங்கள். அரசு vs தனியார் கல்லூரிகள், இடம் மற்றும் பாடநெறி கட்டணத்தை கருத்தில் கொள்ளுங்கள். அதிகாரப்பூர்வ வலைத்தளங்கள் மற்றும் மருத்துவக் கவுன்சில் பட்டியல்கள் மூலம் ஆராயுங்கள்.

📊 படி 4: நுழைவுத் தேர்வுகள்
எம்பிபிஎஸ்/பிடிஎஸ் சேர்க்கைக்கு நீட்-யூஜி கட்டாயமானது. பயிற்சி நிறுவனங்கள், சுய-ஆய்வு மற்றும் போலித்தேர்வுகள் மூலம் தயார்படுங்கள். உயிரியல் (தாவரவியல் மற்றும் விலங்கியல்), இயற்பியல் மற்றும் வேதியியலில் கவனம் செலுத்துங்கள். எம்சிக்யூக்கள் மற்றும் நேர மேலாண்மையைப் பயிற்சி செய்யுங்கள்.

💰 படி 5: விண்ணப்ப செயல்முறை
நீட் கவுன்சலிங் (ஐக்யூக்கு எம்சிசி, மாநில ஒதுக்கீட்டுக்கு மாநில கவுன்சலிங்) வழியாக விண்ணப்பிக்கவும். கவுன்சலிங் கட்டணம் (₹1000-₹5000) செலுத்தவும். துல்லியமான விவரங்களுடன் பதிவு செய்து தேவையான ஆவணங்களை ஆன்லைனில் பதிவேற்றவும்.

🎓 படி 6: சேர்க்கை செயல்முறை
நீட் தரவரிசையின் அடிப்படையில் கவுன்சலிங் சுற்றுகளில் கலந்துகொள்ளவும். தகுதி மற்றும் விருப்பங்களுக்கு ஏற்ப கல்லூரிகள் மற்றும் பாடநெறிகளைத் தேர்ந்தெடுக்கவும். ஆவண சரிபார்ப்பு மற்றும் மருத்துவ உடற்தகுதி சோதனைகளில் கலந்துகொள்ளவும்.

✅ படி 7: இறுதி படிகள்
சேர்க்கை நடைமுறைகளை முடிக்கவும், பாடநெறி கட்டணம் செலுத்தவும், தேவைப்பட்டால் ஹாஸ்டல் தங்குமிடத்தை ஏற்பாடு செய்யவும், அர்ப்பணிப்பு மற்றும் உறுதியுடன் கடுமையான மருத்துவப் பாடத்திட்டத்திற்குத் தயார்படுங்கள்.

⚠️ முக்கிய குறிப்புகள்
• சிறந்த பிசிபி மதிப்பெண்களைப் பராமரிக்கவும் (60%க்கு மேல் விருப்பமானது)
• நீட் தயார்ப்பை ஆரம்பத்தில் தொடங்குங்கள் (வகுப்பு 11)
• கருத்து தெளிவு மற்றும் தொடர்ந்த பயிற்சியில் கவனம் செலுத்துங்கள்
• மருத்துவக் கவுன்சில் ஒழுங்காற்றுகளைப் புதுப்பித்து வைத்திருங்கள்
• நீட் ஸ்கோர்கள் மிதமானதாக இருந்தால் மாற்று மருத்துவப் பாடநெறிகளைக் கருத்தில் கொள்ளுங்கள்`
      },

      Arts: {
        en: `📋 ADMISSION GUIDE FOR ARTS STREAM

🎯 Step 1: Career Counseling
Discuss your interests in arts subjects (Literature, History, Sociology, Psychology, etc.) with career counselors. They will help you explore career paths in teaching, journalism, law, social work, and creative fields based on your strengths and interests.

📝 Step 2: Document Preparation
Gather: 10th & 12th mark sheets, entrance exam scorecards (if applicable), caste certificate, income certificate, photos, and address proof. Keep all documents attested and maintain good academic records.

🏫 Step 3: College Selection
Choose colleges based on faculty reputation, course curriculum, extracurricular activities, and placement opportunities. Consider DU, JNU, BHU, and other reputed arts colleges. Research through college websites and education fairs.

📊 Step 4: Entrance Exams
CUET for central universities, state-specific exams for regional colleges. Some courses may require specific entrance tests. Prepare through self-study, coaching, and practice papers focusing on general knowledge and subject-specific topics.

💰 Step 5: Application Process
Apply through university portals or common entrance platforms. Pay application fees (₹300-₹1500). Fill forms with accurate academic and personal details. Keep track of multiple application deadlines.

🎓 Step 6: Admission Process
Participate in counseling based on merit or entrance scores. Choose colleges and specializations according to your preferences. Some courses may require interviews or portfolio submissions.

✅ Step 7: Final Steps
Complete admission formalities, pay fees, arrange accommodation if needed, and prepare for diverse arts curriculum covering humanities, social sciences, and creative subjects.

⚠️ Important Tips
• Develop strong communication and analytical skills
• Participate in extracurricular activities and competitions
• Build a portfolio for creative courses
• Consider interdisciplinary combinations
• Explore both academic and professional career paths`,

        hi: `📋 आर्ट्स स्ट्रीम के लिए प्रवेश मार्गदर्शिका

🎯 चरण 1: करियर काउंसलिंग
आर्ट्स विषयों (साहित्य, इतिहास, समाजशास्त्र, मनोविज्ञान, आदि) में अपनी रुचि पर करियर काउंसलर से चर्चा करें। वे शिक्षण, पत्रकारिता, कानून, सामाजिक कार्य और रचनात्मक क्षेत्रों में करियर पथ का पता लगाने में आपकी मदद करेंगे।

📝 चरण 2: दस्तावेज तैयारी
एकत्र करें: 10वीं और 12वीं की मार्कशीट, प्रवेश परीक्षा स्कोरकार्ड (यदि लागू हो), जाति प्रमाणपत्र, आय प्रमाणपत्र, फोटो, और पता प्रमाण। सभी दस्तावेज प्रमाणित रखें और अच्छे शैक्षणिक रिकॉर्ड बनाए रखें।

🏫 चरण 3: कॉलेज चयन
फैकल्टी प्रतिष्ठा, कोर्स पाठ्यक्रम, अतिरिक्त पाठ्यक्रम गतिविधियों और प्लेसमेंट अवसरों के आधार पर कॉलेज चुनें। डीयू, जेएनयू, बीएचयू और अन्य प्रतिष्ठित आर्ट्स कॉलेज पर विचार करें। कॉलेज वेबसाइटों और शिक्षा मेले के माध्यम से शोध करें।

📊 चरण 4: प्रवेश परीक्षाएं
केंद्रीय विश्वविद्यालयों के लिए सीयूईटी, क्षेत्रीय कॉलेजों के लिए राज्य-विशिष्ट परीक्षाएं। कुछ कोर्स विशिष्ट प्रवेश परीक्षा की आवश्यकता हो सकती है। सामान्य ज्ञान और विषय-विशिष्ट विषयों पर ध्यान केंद्रित करते हुए स्व-अध्ययन, कोचिंग और अभ्यास पत्रों के माध्यम से तैयारी करें।

💰 चरण 5: आवेदन प्रक्रिया
विश्वविद्यालय पोर्टलों या सामान्य प्रवेश प्लेटफॉर्म के माध्यम से आवेदन करें। आवेदन शुल्क (₹300-₹1500) का भुगतान करें। सटीक शैक्षणिक और व्यक्तिगत विवरण के साथ फॉर्म भरें। एकाधिक आवेदन समय सीमा का ट्रैक रखें।

🎓 चरण 6: प्रवेश प्रक्रिया
मेरिट या प्रवेश स्कोर के आधार पर काउंसलिंग में भाग लें। अपनी वरीयताओं के अनुसार कॉलेज और विशेषज्ञताएं चुनें। कुछ कोर्स साक्षात्कार या पोर्टफोलियो सबमिशन की आवश्यकता हो सकती है।

✅ चरण 7: अंतिम चरण
प्रवेश औपचारिकताएं पूरी करें, फीस का भुगतान करें, यदि आवश्यक हो तो आवास की व्यवस्था करें, और मानविकी, सामाजिक विज्ञान और रचनात्मक विषयों को कवर करने वाले विविध आर्ट्स पाठ्यक्रम के लिए तैयार हों।

⚠️ महत्वपूर्ण सुझाव
• मजबूत संचार और विश्लेषणात्मक कौशल विकसित करें
• अतिरिक्त पाठ्यक्रम गतिविधियों और प्रतियोगिताओं में भाग लें
• रचनात्मक कोर्स के लिए पोर्टफोलियो बनाएं
• अंतःविषयक संयोजनों पर विचार करें
• शैक्षणिक और व्यावसायिक करियर पथ दोनों का पता लगाएं`,

        ta: `📋 கலை ஸ்ட்ரீமுக்கான சேர்க்கை வழிகாட்டி

🎯 படி 1: தொழில் ஆலோசனை
கலை பாடங்களில் (இலக்கியம், வரலாறு, சமூகவியல், உளவியல் போன்றவை) உங்கள் ஆர்வத்தை தொழில் ஆலோசகருடன் கலந்துரையாடுங்கள். அவர்கள் கற்பித்தல், செய்தியாளர்துறை, சட்டம், சமூக வேலை மற்றும் படைப்புத் துறைகளில் தொழில் பாதைகளை ஆராய உதவுவார்கள்.

📝 படி 2: ஆவண தயாரிப்பு
சேகரிக்கவும்: 10வது மற்றும் 12வது மதிப்பெண் தாள்கள், நுழைவுத் தேர்வு ஸ்கோர்கார்டுகள் (பொருந்தினால்), சாதி சான்றிதழ், வருமான சான்றிதழ், புகைப்படங்கள் மற்றும் முகவரி ஆதாரம். எல்லா ஆவணங்களையும் சான்றளித்து வைத்திருங்கள் மற்றும் சிறந்த கல்வி பதிவுகளைப் பராமரிக்கவும்.

🏫 படி 3: கல்லூரி தேர்வு
பாட்டாளர்களின் நற்பெயர், பாடநெறி பாடத்திட்டம், கூடுதல் பாடத்திட்ட நடவடிக்கைகள் மற்றும் வேலைவாய்ப்பு வாய்ப்புகளின் அடிப்படையில் கல்லூரிகளைத் தேர்ந்தெடுங்கள். டியூ, ஜேஎன்யூ, பிஎச்யூ மற்றும் பிற மதிப்புமிக்க கலை கல்லூரிகளைக் கருத்தில் கொள்ளுங்கள். கல்லூரி வலைத்தளங்கள் மற்றும் கல்வி கண்காட்சிகள் மூலம் ஆராயுங்கள்.

📊 படி 4: நுழைவுத் தேர்வுகள்
மையப்படுத்தப்பட்ட பல்கலைக்கழகங்களுக்கு சியூஇடி, பிராந்திய கல்லூரிகளுக்கு மாநில-குறிப்பிட்ட தேர்வுகள். சில பாடநெறிகளுக்கு குறிப்பிட்ட நுழைவுத் தேர்வுகள் தேவைப்படலாம். பொதுஅறிவு மற்றும் பாடம்-குறிப்பிட்ட தலைப்புகளில் கவனம் செலுத்தி சுய-ஆய்வு, பயிற்சி மற்றும் பயிற்சி காகிதங்கள் மூலம் தயார்படுங்கள்.

💰 படி 5: விண்ணப்ப செயல்முறை
பல்கலைக்கழக போர்ட்டல்கள் அல்லது பொதுவான நுழைவுத் தளங்கள் வழியாக விண்ணப்பிக்கவும். விண்ணப்பக் கட்டணம் (₹300-₹1500) செலுத்தவும். துல்லியமான கல்வி மற்றும் தனிப்பட்ட விவரங்களுடன் படிவங்களை நிரப்பவும். பல விண்ணப்ப காலக்கெடுவை கண்காணிக்கவும்.

🎓 படி 6: சேர்க்கை செயல்முறை
தகுதி அல்லது நுழைவு ஸ்கோரின் அடிப்படையில் கவுன்சலிங் இல் கலந்துகொள்ளவும். உங்கள் விருப்பங்களுக்கு ஏற்ப கல்லூரிகள் மற்றும் சிறப்புத்துறைகளைத் தேர்ந்தெடுக்கவும். சில பாடநெறிகளுக்கு நேர்காணல்கள் அல்லது போர்ட்போலியோ சமர்ப்பிப்புகள் தேவைப்படலாம்.

✅ படி 7: இறுதி படிகள்
சேர்க்கை நடைமுறைகளை முடிக்கவும், கட்டணம் செலுத்தவும், தேவைப்பட்டால் தங்குமிடத்தை ஏற்பாடு செய்யவும், மனிதநேயம், சமூக அறிவியல் மற்றும் படைப்பு பாடங்களை உள்ளடக்கிய பல்வேறு கலைப் பாடத்திட்டத்திற்குத் தயார்படுங்கள்.

⚠️ முக்கிய குறிப்புகள்
• வலிமையான தொடர்பு மற்றும் பகுப்பாய்வுத் திறன்களை வளர்த்துக் கொள்ளுங்கள்
• கூடுதல் பாடத்திட்ட நடவடிக்கைகள் மற்றும் போட்டிகளில் கலந்துகொள்ளுங்கள்
• படைப்பு பாடநெறிகளுக்கு போர்ட்போலியோவை உருவாக்குங்கள்
• இடைநிலை கல்வி கலவைகளைக் கருத்தில் கொள்ளுங்கள்
• கல்வி மற்றும் தொழில்முறை தொழில் பாதைகளை இரண்டையும் ஆராயுங்கள்`
      }
    };

    // Get the appropriate guide based on selected language and stream
    const selectedGuide = guides[guideStream]?.[selectedLanguage] || guides[guideStream]?.en || "Guide not available for selected combination.";

    setGuideResult(selectedGuide);
    setGuideLoading(false);
  };

  const handleDayInLife = async () => {
    if (!dayInLifeCareer.trim()) return;

    // only allow online mode
    if (aiMode !== "online") {
      setDayInLifeResult("⚠️ Day in Life feature works only in Online AI mode.");
      return;
    }

    setDayInLifeLoading(true);
    setDayInLifeResult(null);

    const prompt = `
You are a career counselor. Provide a detailed "Day in the Life" simulation for someone working in the career: ${dayInLifeCareer}.

IMPORTANT:
- Be realistic and engaging.
- Structure it chronologically from morning to evening.
- Include typical tasks, challenges, and rewards.
- Keep it informative and inspiring.
- Use emojis for visual appeal.

Return EXACTLY in this format:

🌅 A DAY IN THE LIFE OF A ${dayInLifeCareer.toUpperCase()}

⏰ 8:00 AM - [Morning activity]
[2-3 sentences describing what they do]

⏰ 9:00 AM - [Next activity]
[2-3 sentences]

⏰ [Continue with time slots until evening]

🌙 Evening Reflection
[2-3 sentences about winding down and thoughts on the day]

💡 Key Insights
- Insight 1
- Insight 2
- Insight 3

${selectedLanguage !== "en" ? `\n\nProvide the entire response in ${selectedLanguage === "hi" ? "Hindi" : "Tamil"} language.` : ""}
`;

    try {
      const result = await callAI(prompt, 1200);
      setDayInLifeResult(result.trim());
    } catch {
      setDayInLifeResult("⚠️ Error generating day in life simulation.");
    }

    setDayInLifeLoading(false);
  };

  const handleDownloadCareerPlan = () => {
    if (!roadmap) return;

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">Career Plan</h1>
        <div style="line-height: 1.6;">
          ${roadmap.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            Generated by Career Compass AI
          </p>
        </div>
      </div>
    `;

    const options = {
      margin: 1,
      filename: 'career-plan.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(options).from(element).save();
  };

  if (!role) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-black text-white' : 'bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900'}`}>
        <div className="text-center space-y-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            Career Compass AI
          </h1>
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => setRole("student")}
              className={`px-8 py-4 rounded-xl ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
            >
              🎓 Student
            </button>
            <button
              onClick={() => setRole("parent")}
              className={`px-8 py-4 rounded-xl ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
            >
              👨‍👩‍👧 Parent
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-100' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900'}`}>
      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-72 flex-col ${isDarkMode ? 'bg-gradient-to-b from-indigo-950 via-slate-950 to-black border-gray-800' : 'bg-gradient-to-b from-blue-100 via-white to-indigo-100 border-gray-300'} border-r p-5 gap-6`}>
        <div className="flex items-start justify-between">
          <div>
            <div className={`text-xl font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>Career Compass</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI Admissions Advisor</div>
          </div>
          <div className="text-xs text-gray-500">{role === "student" ? "Student" : "Parent"}</div>
        </div>

        <div>
          <div className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Mode</div>
          <div className="flex gap-2">
            <button
              onClick={() => setAiMode("local")}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                aiMode === "local"
                  ? `${isDarkMode ? 'bg-indigo-600 text-white shadow' : 'bg-indigo-500 text-white shadow'}`
                  : `${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
              }`}
            >
              <HardDrive size={16} />
              <span className="ml-2">Local</span>
            </button>
            <button
              onClick={() => setAiMode("online")}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                aiMode === "online"
                  ? `${isDarkMode ? 'bg-emerald-500 text-white shadow' : 'bg-emerald-400 text-white shadow'}`
                  : `${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
              }`}
            >
              <Wifi size={16} />
              <span className="ml-2">Online</span>
            </button>
          </div>
        </div>

        {aiMode === "online" && (
          <div>
            <div className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Language</div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-gray-200 text-gray-800 border-gray-300'} border`}
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="ta">Tamil (தமிழ்)</option>
            </select>
          </div>
        )}

        <div className="flex-1">
          <div className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Tools</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Geolocation not supported by your browser");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const query = "career+counseling+office+near+me";
                    const url = `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`;
                    window.open(url, "_blank");
                  },
                  () => {
                    window.open(
                      "https://www.google.com/maps/search/career+counseling+office+near+me",
                      "_blank"
                    );
                  }
                );
              }}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              📍 Nearby Offices
            </button>
            <button
              onClick={() => setShowCompare(true)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              ⚖️ Compare Courses
            </button>
            <button
              onClick={() => setShowEligibility(true)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              📚 Eligibility Check
            </button>
            <button
              onClick={() => setShowAdmissionGuide(true)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              📋 Admission Guide
            </button>
            <button
              onClick={() => setShowDayInLife(true)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              🌅 Day in Life
            </button>
            <button
              onClick={() => setShowHelpline(true)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              📞 Helpline
            </button>
          </div>
        </div>

        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Tip: Use Online mode for eligibility checks. Admission guides work in both modes.
        </div>

        {/* THEME TOGGLE */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col">
        {/* MOBILE HEADER */}
        <div className={`md:hidden border-b ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-white/50'} p-4 flex items-center justify-between backdrop-blur-sm`}>
          <div>
            <div className={`text-lg font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Career Compass AI</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{role === "student" ? "Student" : "Parent"}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{aiMode === "online" ? "Online" : "Local"}</span>
            <div
              className={`h-2 w-2 rounded-full ${
                aiMode === "online" ? "bg-emerald-400" : "bg-indigo-400"
              }`}
            />
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 message-enter ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs">
                  🧭
                </div>
              )}
              <div
  className={`max-w-[72%] px-4 py-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-left rounded-2xl ${
    m.role === "user"
      ? "bg-indigo-600 text-white"
      : isDarkMode
        ? "bg-gray-800 border border-gray-700 text-gray-100"
        : "bg-gray-100 border border-gray-300 text-gray-900"
  }`}
>
              
                <ReactMarkdown>{m.content}</ReactMarkdown>
                <div className="text-xs text-gray-400 mt-2">{m.timestamp}</div>
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                  {role === "student" ? "🎓" : "👨‍👩‍👧"}
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-300 bg-white/40'} p-3 flex gap-2 backdrop-blur-sm`}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className={`flex-1 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} border rounded-full px-4 py-3`}
            placeholder="Ask anything about careers..."
          />
          <button
            onClick={startListening}
            className={`w-11 h-11 rounded-full flex items-center justify-center ${
              listening ? "bg-red-500 animate-pulse" : isDarkMode ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <Mic size={18} />
          </button>
          <button
            onClick={handleSend}
            className={`px-4 rounded-full ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'}`}
          >
            <Send size={20} />
          </button>
        </div>
      </main>

      {/* ROADMAP PANEL */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-2/5 ${isDarkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-300'} border-l transition-transform duration-300 ${
          showRoadmap ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className={`p-4 flex justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} border-b`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Career Roadmap</h2>
            {roadmap && (
              <button
                onClick={handleDownloadCareerPlan}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
              >
                <Download size={14} />
                Download PDF
              </button>
            )}
          </div>
          <button onClick={() => setShowRoadmap(false)} className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}>
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-full">
          {roadmapLoading ? "Generating roadmap..." : <ReactMarkdown>{roadmap}</ReactMarkdown>}
        </div>
      </div>

      {/* COMPARE COURSES MODAL */}
      {showCompare && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h2 className="font-bold text-lg text-white">⚖️ Compare Courses</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Select criteria and enter two courses to compare
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCompare(false);
                  setCompareResults(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Course Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Course A
                  </label>
                  <input
                    value={course1}
                    onChange={(e) => setCourse1(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Course B
                  </label>
                  <input
                    value={course2}
                    onChange={(e) => setCourse2(e.target.value)}
                    placeholder="e.g. Data Science"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              {/* Criteria Buttons */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Select Criteria
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "salary", label: "💰 Salary" },
                    { key: "jobDemand", label: "📈 Job Demand" },
                    { key: "duration", label: "⏱ Duration" },
                    { key: "skills", label: "🛠 Skills" },
                    { key: "scope", label: "🌍 Future Scope" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() =>
                        setCriteria((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        criteria[key]
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Compare Button */}
              <button
                onClick={handleCompare}
                disabled={compareLoading || !course1.trim() || !course2.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold"
              >
                {compareLoading ? "Comparing..." : "Compare →"}
              </button>
              {/* Loading */}
              {compareLoading && (
                <div className="flex items-center justify-center gap-3 py-4 text-gray-400 text-sm">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Analyzing courses...
                </div>
              )}
              {/* Results */}
              {compareResults && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                  <ReactMarkdown>{compareResults}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ELIGIBILITY CHECK MODAL */}
      {showEligibility && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h2 className="font-bold text-lg text-white">📚 Eligibility Check</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enter your 12th marks/cutoff and preferences to get eligible courses and colleges
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEligibility(false);
                  setEligibilityResult(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    12th Marks/Cutoff
                  </label>
                  <input
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="e.g. 95% or 180/200"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">
                      Stream
                    </label>
                    <select
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Stream</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Medical">Medical</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">
                      Location
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Location</option>
                      <option value="India">India</option>
                      <option value="Abroad">Abroad</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Check Button */}
              <button
                onClick={handleEligibility}
                disabled={eligibilityLoading || !marks.trim() || !stream || !location}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold"
              >
                {eligibilityLoading ? "Checking..." : "Check Eligibility →"}
              </button>
              {/* Loading */}
              {eligibilityLoading && (
                <div className="flex items-center justify-center gap-3 py-4 text-gray-400 text-sm">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Analyzing eligibility...
                </div>
              )}
              {/* Results */}
              {eligibilityResult && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                  <ReactMarkdown>{eligibilityResult}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMISSION GUIDE MODAL */}
      {showAdmissionGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h2 className="font-bold text-lg text-white">📋 Admission Guide</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Step-by-step guide for college admissions through counseling
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAdmissionGuide(false);
                  setGuideResult(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Stream Select */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Select Stream
                </label>
                <select
                  value={guideStream}
                  onChange={(e) => setGuideStream(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Stream</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Medical">Medical</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>
              {/* Generate Button */}
              <button
                onClick={handleAdmissionGuide}
                disabled={guideLoading || !guideStream}
                className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold"
              >
                {guideLoading ? "Generating..." : "Get Admission Guide →"}
              </button>
              {/* Loading */}
              {guideLoading && (
                <div className="flex items-center justify-center gap-3 py-4 text-gray-400 text-sm">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  Preparing guide...
                </div>
              )}
              {/* Results */}
              {guideResult && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                  <ReactMarkdown>{guideResult}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DAY IN LIFE MODAL */}
      {showDayInLife && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h2 className="font-bold text-lg text-white">🌅 Day in Life</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Experience a typical day in the life of a professional in your chosen career
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDayInLife(false);
                  setDayInLifeResult(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Career Input */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Enter Career/Profession
                </label>
                <input
                  value={dayInLifeCareer}
                  onChange={(e) => setDayInLifeCareer(e.target.value)}
                  placeholder="e.g. Software Engineer, Doctor, Teacher"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {/* Generate Button */}
              <button
                onClick={handleDayInLife}
                disabled={dayInLifeLoading || !dayInLifeCareer.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold"
              >
                {dayInLifeLoading ? "Generating..." : "Experience Day →"}
              </button>
              {/* Loading */}
              {dayInLifeLoading && (
                <div className="flex items-center justify-center gap-3 py-4 text-gray-400 text-sm">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Simulating day...
                </div>
              )}
              {/* Results */}
              {dayInLifeResult && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                  <ReactMarkdown>{dayInLifeResult}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HELPLINE MODAL */}
      {showHelpline && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h2 className="font-bold text-lg text-white">📞 Career Helpline</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Contact these officials for career guidance and employment assistance
                </p>
              </div>
              <button
                onClick={() => setShowHelpline(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Helpline Numbers */}
              <div className="space-y-3">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">👨‍💼</span>
                    <div>
                      <h3 className="font-semibold text-white">Deputy Director</h3>
                      <p className="text-sm text-gray-400">Employment Office</p>
                    </div>
                  </div>
                  <a
                    href="tel:044-24615160"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    📞 044-24615160
                  </a>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">🏢</span>
                    <div>
                      <h3 className="font-semibold text-white">District Employment Officer</h3>
                      <p className="text-sm text-gray-400">District Office</p>
                    </div>
                  </div>
                  <a
                    href="tel:044-22500835"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    📞 044-22500835
                  </a>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">👨‍💼</span>
                    <div>
                      <h3 className="font-semibold text-white">Deputy Director</h3>
                      <p className="text-sm text-gray-400">Employment Services</p>
                    </div>
                  </div>
                  <a
                    href="tel:044-22501032"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    📞 044-22501032
                  </a>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">👨‍💼</span>
                    <div>
                      <h3 className="font-semibold text-white">Assistant Director</h3>
                      <p className="text-sm text-gray-400">Career Guidance</p>
                    </div>
                  </div>
                  <a
                    href="tel:044-27660250"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    📞 044-27660250
                  </a>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400">ℹ️</span>
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-300 mb-1">Need Help?</p>
                    <p>These helpline numbers are for career counseling, job placement assistance, and employment guidance. Call during office hours for best assistance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}