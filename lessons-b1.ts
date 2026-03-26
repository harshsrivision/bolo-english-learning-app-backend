import { createChapter, createLesson, type Lesson } from "./content-builders";

export const b1Lessons: Lesson[] = [
  createLesson(
    13,
    "Workplace English — Meetings",
    "B1",
    30,
    "Speak in meetings with updates, clarifications, and polite interruptions.",
    "Office meetings mein sirf sunna nahi, balki update dena, point clear karna aur politely bolna bhi zaroori hota hai.",
    12,
    [
      createChapter(
        "l13-meeting-phrases",
        "Core Meeting Phrases",
        "Meeting mein kaam aane wale phrases",
        "vocabulary",
        [
          ["Let us begin with the sales update.", "Chalo sales update se shuru karte hain."],
          ["I would like to add one point.", "Main ek point add karna chahta hoon."],
          ["Can we move to the next item?", "Kya hum next item par ja sakte hain?"],
          ["Here is the current status.", "Yeh current status hai."]
        ],
        {
          question: "Which phrase is used to add a point?",
          options: ["I would like to add one point.", "I woke up early.", "This is too blue.", "Where is my bag?"],
          answer: "I would like to add one point.",
          hindiHint: "Meeting ke beech apni baat add karne wala phrase chuno."
        }
      ),
      createChapter(
        "l13-giving-updates",
        "Giving a Clear Update",
        "Status update ko clearly bolna",
        "grammar",
        [
          ["The design draft is ready now.", "Design draft ab ready hai."],
          ["We faced a delay from the vendor.", "Humein vendor ki taraf se delay mila."],
          ["We will share the revised file by evening.", "Hum revised file shaam tak bhej denge."],
          ["The main issue is approval time.", "Main issue approval ka time hai."]
        ],
        {
          question: "What usually comes after the current status in an update?",
          options: ["Challenge or issue", "A random joke", "Your hometown", "Movie review"],
          answer: "Challenge or issue",
          hindiHint: "Update ko logical order mein socho."
        }
      ),
      createChapter(
        "l13-clarifying",
        "Clarifying and Interrupting Politely",
        "Beech mein politely clear karna",
        "speaking",
        [
          ["Sorry to interrupt, but can I clarify one thing?", "Interrupt karne ke liye sorry, lekin kya main ek cheez clear kar sakta hoon?"],
          ["Could you explain the timeline once more?", "Kya aap timeline ek baar aur explain kar sakte hain?"],
          ["Just to confirm, the launch is on Friday, right?", "Confirm karne ke liye, launch Friday ko hi hai na?"],
          ["May I add something here?", "Kya main yahan kuch add kar sakta hoon?"]
        ],
        {
          question: "Which phrase politely asks for clarification?",
          options: ["Could you explain the timeline once more?", "You are not clear.", "No idea.", "Talk faster."],
          answer: "Could you explain the timeline once more?",
          hindiHint: "Clarification maangne wali soft line chuno."
        }
      ),
      createChapter(
        "l13-summary-review",
        "Meeting Summary Review",
        "Meeting ke baad summary banana",
        "quiz",
        [
          ["The team approved the new layout.", "Team ne naya layout approve kar diya."],
          ["Ritu will share the notes by 5 p.m.", "Ritu 5 baje tak notes share karegi."],
          ["The client call is scheduled for Monday.", "Client call Monday ke liye scheduled hai."],
          ["We need one final review tomorrow.", "Humein kal ek final review chahiye."]
        ],
        {
          question: "Which detail must a meeting summary include?",
          options: ["Deadlines", "Favorite songs", "Weather report", "Personal hobby"],
          answer: "Deadlines",
          hindiHint: "Follow-up ke liye kaunsi detail zaroori hoti hai?"
        }
      )
    ]
  ),
  createLesson(
    14,
    "Email Writing",
    "B1",
    28,
    "Write cleaner work emails with strong openings, requests, and closings.",
    "Professional email likhna job life ka daily part hai. Yeh lesson tumhe formal aur clear email flow sikhaata hai.",
    13,
    [
      createChapter(
        "l14-openings",
        "Subject Lines and Openings",
        "Email ka subject aur opening",
        "vocabulary",
        [
          ["Subject: Updated Project Timeline", "Subject: Updated Project Timeline"],
          ["Dear Rahul, I hope you are doing well.", "Dear Rahul, umeed hai aap theek honge."],
          ["I am writing to share the latest update.", "Main latest update share karne ke liye likh raha hoon."],
          ["Please find the attached document below.", "Attached document niche diya gaya hai, please dekhiye."]
        ],
        {
          question: "What should be clear in an email subject?",
          options: ["Main topic", "Your mood", "A joke", "A random quote"],
          answer: "Main topic",
          hindiHint: "Subject dekhkar hi message ka topic samajh aana chahiye."
        }
      ),
      createChapter(
        "l14-structure",
        "Formal Email Structure",
        "Email ko logical blocks mein likhna",
        "grammar",
        [
          ["I am writing to request leave for Friday.", "Main Friday ki leave request karne ke liye likh raha hoon."],
          ["The report is attached for your review.", "Report aapke review ke liye attach hai."],
          ["Please share your feedback by noon.", "Please noon tak apna feedback share kar dijiye."],
          ["Regards, Ankit", "Regards, Ankit"]
        ],
        {
          question: "What usually comes before the closing?",
          options: ["Action request", "Your childhood story", "Weather", "Lunch plan"],
          answer: "Action request",
          hindiHint: "Email structure ka order yaad karo."
        }
      ),
      createChapter(
        "l14-followups",
        "Requests and Follow-Ups",
        "Email mein request aur follow-up karna",
        "speaking",
        [
          ["Could you please review the attached file?", "Kya aap attached file review kar sakte hain, please?"],
          ["I wanted to follow up on my previous email.", "Main apni pichhli email par follow-up karna chahta tha."],
          ["Please let me know if any changes are needed.", "Agar koi changes chahiye hon to please batayiye."],
          ["I would appreciate a quick confirmation.", "Mujhe ek quick confirmation mil jaye to achha hoga."]
        ],
        {
          question: "Which line sounds like a professional follow-up?",
          options: ["I wanted to follow up on my previous email.", "Why no reply?", "Reply now.", "You forgot."],
          answer: "I wanted to follow up on my previous email.",
          hindiHint: "Follow-up ko soft aur professional rakho."
        }
      ),
      createChapter(
        "l14-tone-check",
        "Tone Check Quiz",
        "Formal tone ka quick check",
        "quiz",
        [
          ["Please share the final file when convenient.", "Jab convenient ho tab final file share kar dijiye."],
          ["Kindly confirm your availability for tomorrow.", "Kripya kal ke liye apni availability confirm kar dijiye."],
          ["Thank you for your support.", "Aapke support ke liye dhanyavaad."],
          ["I look forward to your response.", "Main aapke response ka intezaar karunga."]
        ],
        {
          question: "Which tone is best for work email?",
          options: ["Clear and respectful", "Angry and direct", "Very casual", "Confusing and long"],
          answer: "Clear and respectful",
          hindiHint: "Professional tone kis tarah ka hota hai?"
        }
      )
    ]
  ),
  createLesson(
    15,
    "Telling Stories — Past Continuous",
    "B1",
    26,
    "Set a scene, describe ongoing past action, and tell better spoken stories.",
    "Story bolte waqt sirf kya hua nahi, balki kya chal raha tha yeh batana bhi important hota hai.",
    14,
    [
      createChapter(
        "l15-scene-setting",
        "Setting the Scene",
        "Story ka background banana",
        "grammar",
        [
          ["I was walking home when it started raining.", "Main ghar ja raha tha tab baarish shuru hui."],
          ["She was studying at the library.", "Woh library mein padh rahi thi."],
          ["We were waiting near the bus stop.", "Hum bus stop ke paas wait kar rahe the."],
          ["The kids were playing outside.", "Bacche bahar khel rahe the."]
        ],
        {
          question: "Which tense shows an action in progress in the past?",
          options: ["Past continuous", "Present simple", "Future simple", "Imperative"],
          answer: "Past continuous",
          hindiHint: "Jo kaam past mein chal raha tha, uska tense yaad karo."
        }
      ),
      createChapter(
        "l15-interrupted-actions",
        "Interrupted Actions",
        "Ek kaam chal raha tha, doosra beech mein hua",
        "grammar",
        [
          ["I was sleeping when the phone rang.", "Main so raha tha jab phone baja."],
          ["They were discussing the plan when the manager entered.", "Woh plan discuss kar rahe the jab manager andar aaye."],
          ["She was cooking when the lights went off.", "Woh cooking kar rahi thi jab lights chali gayi."],
          ["We were driving when we saw the accident.", "Hum drive kar rahe the jab humne accident dekha."]
        ],
        {
          question: "Which event is usually in the past simple?",
          options: ["The interrupting event", "The background action", "Both together", "None"],
          answer: "The interrupting event",
          hindiHint: "Beech mein jo event hua, uska tense kaunsa hota hai?"
        }
      ),
      createChapter(
        "l15-storytelling",
        "Tell a Better Story Aloud",
        "Story ko engaging tarike se sunao",
        "speaking",
        [
          ["I was traveling to Delhi for an interview.", "Main interview ke liye Delhi travel kar raha tha."],
          ["The train was moving slowly because of fog.", "Fog ki wajah se train dheere chal rahi thi."],
          ["Suddenly, my phone battery died.", "Achanak mera phone battery off ho gaya."],
          ["That is how the day became stressful.", "Isi tarah din stressful ban gaya."]
        ],
        {
          question: "What makes a spoken story more engaging?",
          options: ["Scene details", "Only one verb", "No ending", "Random list"],
          answer: "Scene details",
          hindiHint: "Story ko zinda kaun banata hai?"
        }
      )
    ]
  ),
  createLesson(
    16,
    "Problem Solving Language",
    "B1",
    24,
    "Describe issues, suggest solutions, and escalate clearly in work or service contexts.",
    "Problem ko calm aur clear English mein explain karna workplace aur customer situations dono mein bahut zaroori skill hai.",
    15,
    [
      createChapter(
        "l16-describe-problem",
        "Describing the Problem Clearly",
        "Issue ko clearly explain karna",
        "vocabulary",
        [
          ["The payment link is not working.", "Payment link kaam nahi kar raha hai."],
          ["This issue started this morning.", "Yeh issue aaj subah start hua."],
          ["The delay is affecting our dispatch.", "Delay hamare dispatch ko affect kar raha hai."],
          ["I cannot access the dashboard now.", "Main ab dashboard access nahi kar paa raha hoon."]
        ],
        {
          question: "Which sentence explains the impact?",
          options: ["The delay is affecting our dispatch.", "Hello there.", "I like coffee.", "This is blue."],
          answer: "The delay is affecting our dispatch.",
          hindiHint: "Impact ya asar batane wali line chuno."
        }
      ),
      createChapter(
        "l16-suggest-solutions",
        "Suggesting Solutions",
        "Solution politely suggest karna",
        "grammar",
        [
          ["We can restart the system once.", "Hum system ko ek baar restart kar sakte hain."],
          ["We should check the server logs.", "Humein server logs check karni chahiye."],
          ["Let us call the vendor directly.", "Chalo vendor ko direct call karte hain."],
          ["We can send a temporary update to the client.", "Hum client ko ek temporary update bhej sakte hain."]
        ],
        {
          question: "Which phrase sounds collaborative?",
          options: ["Let us", "You failed", "Do it now", "Stop talking"],
          answer: "Let us",
          hindiHint: "Team ke saath solution dhoondhne wala phrase chuno."
        }
      ),
      createChapter(
        "l16-escalation",
        "Escalation Roleplay",
        "Issue ko aage raise karna",
        "speaking",
        [
          ["I want to raise an urgent issue.", "Main ek urgent issue raise karna chahta hoon."],
          ["The problem is affecting the client timeline.", "Yeh problem client timeline ko affect kar rahi hai."],
          ["We need support before 4 p.m.", "Humein 4 baje se pehle support chahiye."],
          ["Please guide us on the next step.", "Please humein next step par guide kijiye."]
        ],
        {
          question: "What should escalation include?",
          options: ["Issue, impact, urgency", "Only anger", "Only greeting", "Only apology"],
          answer: "Issue, impact, urgency",
          hindiHint: "Effective escalation ke teen parts yaad rakho."
        }
      )
    ]
  ),
  createLesson(
    17,
    "Connecting Ideas — Discourse Markers",
    "B1",
    28,
    "Use connectors like however, therefore, and in addition to sound more fluent.",
    "Sentence alag-alag bolna easy hota hai, lekin ideas ko smoothly jodna fluency ka real sign hota hai.",
    16,
    [
      createChapter(
        "l17-adding-ideas",
        "Adding Ideas Smoothly",
        "Also, in addition, moreover ka use",
        "vocabulary",
        [
          ["The report is complete. Also, the charts are ready.", "Report complete hai. Saath hi charts bhi ready hain."],
          ["In addition, we checked the numbers twice.", "Iske alawa humne numbers do baar check kiye."],
          ["Moreover, the team has tested the flow.", "Aur bhi, team ne flow test kar liya hai."],
          ["Besides that, the budget is approved.", "Iske alawa budget bhi approve hai."]
        ],
        {
          question: "Which marker adds one more point?",
          options: ["In addition", "However", "Because", "Although"],
          answer: "In addition",
          hindiHint: "Extra point jodne wala connector chuno."
        }
      ),
      createChapter(
        "l17-contrast-result",
        "Contrast and Result Markers",
        "However, so, therefore ka use",
        "grammar",
        [
          ["The idea is good; however, the timing is risky.", "Idea achha hai; however, timing risky hai."],
          ["The file was missing, so we called the designer.", "File missing thi, isliye humne designer ko call kiya."],
          ["The client approved it; therefore, we moved ahead.", "Client ne approve kar diya; therefore, hum aage badhe."],
          ["I was tired, but I finished the task.", "Main tired tha, lekin maine task finish kiya."]
        ],
        {
          question: "Which word shows a result?",
          options: ["therefore", "however", "although", "while"],
          answer: "therefore",
          hindiHint: "Result dikhane wala discourse marker chuno."
        }
      ),
      createChapter(
        "l17-structured-answer",
        "Structuring a Longer Answer",
        "Long answer ko flow ke saath bolna",
        "speaking",
        [
          ["First, I want to explain the current issue.", "Sabse pehle main current issue explain karna chahta hoon."],
          ["Next, I will show the available options.", "Agla, main available options dikhana chahta hoon."],
          ["However, one risk is still there.", "However, ek risk abhi bhi hai."],
          ["Therefore, I recommend a phased rollout.", "Therefore, main phased rollout recommend karta hoon."]
        ],
        {
          question: "What comes after a main point in a structured answer?",
          options: ["Support or detail", "A random joke", "A goodbye", "A new topic"],
          answer: "Support or detail",
          hindiHint: "Long answer ka logical next step socho."
        }
      ),
      createChapter(
        "l17-connectors-quiz",
        "Connector Choice Quiz",
        "Sahi connector ka selection",
        "quiz",
        [
          ["Sales improved; therefore, we hired more staff.", "Sales improve hui; therefore, humne aur staff hire kiya."],
          ["The plan looks good. However, the budget is tight.", "Plan achha lag raha hai. However, budget tight hai."],
          ["In addition, the support team is trained.", "Iske alawa support team trained hai."],
          ["So, we postponed the launch by one week.", "Isliye humne launch ek hafte ke liye postpone kar diya."]
        ],
        {
          question: "Which connector fits when you want to show contrast?",
          options: ["However", "Therefore", "Also", "So"],
          answer: "However",
          hindiHint: "Contrast ya opposite point dikhane ke liye kaunsa connector aata hai?"
        }
      )
    ]
  ),
  createLesson(
    18,
    "Job Interview Preparation",
    "B1",
    34,
    "Prepare stronger interview answers for strengths, experience, and closing questions.",
    "Interview mein English ke saath structure bhi matter karta hai. Yeh lesson tumhe ready-made confidence deta hai.",
    17,
    [
      createChapter(
        "l18-strengths",
        "Talking About Your Strengths",
        "Apni strengths ko smartly batana",
        "vocabulary",
        [
          ["I am reliable under pressure.", "Main pressure mein bhi reliable rehta hoon."],
          ["I learn new tools quickly.", "Main naye tools jaldi seekh leta hoon."],
          ["I stay calm with customers.", "Main customers ke saath calm rehta hoon."],
          ["I pay attention to details.", "Main details par dhyan deta hoon."]
        ],
        {
          question: "Which strength sounds practical for work?",
          options: ["I pay attention to details.", "I love sleeping.", "I talk all day.", "I avoid tasks."],
          answer: "I pay attention to details.",
          hindiHint: "Job ke context mein useful strength chuno."
        }
      ),
      createChapter(
        "l18-experience",
        "Answering Experience Questions",
        "Experience wale sawalon ka flow",
        "grammar",
        [
          ["In my last role, I handled customer calls.", "Apni last role mein main customer calls handle karta tha."],
          ["I was responsible for daily reports.", "Main daily reports ke liye responsible tha."],
          ["I improved response time by one hour.", "Maine response time ek ghante se improve kiya."],
          ["I worked closely with the sales team.", "Main sales team ke saath closely kaam karta tha."]
        ],
        {
          question: "What should an experience answer include?",
          options: ["Role, responsibility, result", "Only your hobby", "Only your city", "Only your age"],
          answer: "Role, responsibility, result",
          hindiHint: "Experience answer ka core structure yaad karo."
        }
      ),
      createChapter(
        "l18-star-method",
        "STAR Method for Better Answers",
        "Situation, Task, Action, Result",
        "speaking",
        [
          ["The situation was a delayed delivery complaint.", "Situation ek delayed delivery complaint thi."],
          ["My task was to calm the customer and solve it.", "Mera task customer ko calm karna aur issue solve karna tha."],
          ["I coordinated with dispatch and called the customer back.", "Maine dispatch se coordinate karke customer ko dobara call kiya."],
          ["As a result, the customer stayed with us.", "Result yeh hua ki customer humare saath bana raha."]
        ],
        {
          question: "What does R in STAR mean?",
          options: ["Result", "Role", "Review", "Reason"],
          answer: "Result",
          hindiHint: "STAR ka last letter kis cheez ko show karta hai?"
        }
      ),
      createChapter(
        "l18-salary-availability",
        "Salary, Availability, and Notice Period",
        "Sensitive sawalon ko calmly handle karo",
        "listening",
        [
          ["My expected salary is flexible based on the role.", "Meri expected salary role ke hisaab se flexible hai."],
          ["I can join after a thirty-day notice period.", "Main tees din ke notice period ke baad join kar sakta hoon."],
          ["I am available for the final round on Monday.", "Main Monday ko final round ke liye available hoon."],
          ["I would prefer to discuss compensation after understanding the role fully.", "Main role ko poori tarah samajhne ke baad compensation discuss karna pasand karunga."]
        ],
        {
          question: "How should you answer salary questions?",
          options: ["Clearly and politely", "Angrily", "By changing the topic", "With one-word answers only"],
          answer: "Clearly and politely",
          hindiHint: "Sensitive question ka best tone kya hota hai?"
        }
      ),
      createChapter(
        "l18-interview-closing",
        "Strong Interview Closing",
        "Interview ko achhe se close karna",
        "quiz",
        [
          ["Thank you for your time today.", "Aaj apna time dene ke liye thank you."],
          ["I am excited about this opportunity.", "Main is opportunity ko lekar excited hoon."],
          ["Could you share the next steps in the process?", "Kya aap process ke next steps share kar sakte hain?"],
          ["I look forward to hearing from you.", "Main aapke response ka intezaar karunga."]
        ],
        {
          question: "Which line is good for the end of an interview?",
          options: ["Could you share the next steps in the process?", "How long is lunch break?", "I am bored.", "This room is cold."],
          answer: "Could you share the next steps in the process?",
          hindiHint: "Closing mein sensible aur professional line chuno."
        }
      )
    ]
  )
];
