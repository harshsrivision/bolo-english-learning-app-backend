"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foundationLessons = void 0;
const content_builders_1 = require("./content-builders");
exports.foundationLessons = [
    (0, content_builders_1.createLesson)(1, "The English Alphabet & Sounds", "A0", 18, "Recognize letters, say basic sounds, and start reading tiny words aloud.", "English ki bilkul shuruaat. A, B, C ko dekhna hi nahi, unki sound bhi pakadni hai.", null, [
        (0, content_builders_1.createChapter)("l01-letter-names", "Letter Names from A to Z", "A se Z tak letters ko pehchano", "vocabulary", [
            ["A is for apple.", "A apple ke liye use hota hai."],
            ["B comes after A.", "B, A ke baad aata hai."],
            ["My name starts with R.", "Mere naam ki shuruaat R se hoti hai."],
            ["Please spell your city slowly.", "Apne shehar ka naam dheere se spell karo."]
        ], {
            question: "Which letter comes after C?",
            options: ["A", "B", "D", "F"],
            answer: "D",
            hindiHint: "Alphabet ko order mein bolo: A, B, C, D."
        }),
        (0, content_builders_1.createChapter)("l01-vowel-sounds", "Short Vowel Sounds", "A, E, I, O, U ki basic sounds", "grammar", [
            ["A in cat sounds short.", "Cat mein A ki sound chhoti hoti hai."],
            ["E in pen is clear and quick.", "Pen mein E ki sound short hoti hai."],
            ["I in sit is not the same as eye.", "Sit ka I, eye jaisa nahi hota."],
            ["O in hot is a round sound.", "Hot ka O halka round sound deta hai."]
        ], {
            question: "Which word has a short E sound?",
            options: ["pen", "bike", "road", "moon"],
            answer: "pen",
            hindiHint: "Pen bolte waqt short E sound suno."
        }),
        (0, content_builders_1.createChapter)("l01-common-sounds", "Common Sound Pairs", "Ch aur sh jaise sound pairs", "speaking", [
            ["She sells tea in the shop.", "Woh shop mein chai bechti hai."],
            ["Thank you for the help.", "Madad ke liye thank you."],
            ["The chair is near the door.", "Chair darwaze ke paas hai."],
            ["Phone and photo begin with ph.", "Phone aur photo, ph se shuru hote hain."]
        ], {
            question: "Which word starts with the sh sound?",
            options: ["shop", "chair", "thin", "photo"],
            answer: "shop",
            hindiHint: "Shop bolte waqt sh ki hawa jaisi sound aati hai."
        })
    ]),
    (0, content_builders_1.createLesson)(2, "First 50 Survival Words", "A0", 20, "Build a first bank of everyday words used at home, on the street, and in class.", "Yeh lesson tumhe roz ke kaam aane wale words deta hai jinse mini sentences turant ban sakte hain.", 1, [
        (0, content_builders_1.createChapter)("l02-everyday-nouns", "Everyday Nouns", "Roz ke kaam aane wale nouns", "vocabulary", [
            ["My phone is on the table.", "Mera phone table par hai."],
            ["This bag is heavy.", "Yeh bag bhaari hai."],
            ["Please open the door.", "Please darwaza kholo."],
            ["I need water now.", "Mujhe abhi paani chahiye."]
        ], {
            question: "Which word is a thing you can carry?",
            options: ["bag", "drink", "quickly", "happy"],
            answer: "bag",
            hindiHint: "Carry karne wali cheez socho."
        }),
        (0, content_builders_1.createChapter)("l02-action-verbs", "Action Verbs You Use Daily", "Roz use hone wale action verbs", "vocabulary", [
            ["I drink tea every morning.", "Main roz subah chai peeta hoon."],
            ["Come here, please.", "Idhar aao, please."],
            ["She writes in a notebook.", "Woh notebook mein likhti hai."],
            ["We sit near the window.", "Hum khidki ke paas baithte hain."]
        ], {
            question: "Which word shows an action?",
            options: ["chair", "write", "blue", "slow"],
            answer: "write",
            hindiHint: "Action woh hota hai jo koi karta hai."
        }),
        (0, content_builders_1.createChapter)("l02-polite-words", "Polite Words for Survival English", "Please, sorry, thank you ka smart use", "quiz", [
            ["Please give me a glass of water.", "Please mujhe ek glass paani do."],
            ["Sorry, I am late.", "Sorry, main late ho gaya."],
            ["Thank you for waiting.", "Wait karne ke liye thank you."],
            ["Excuse me, where is the washroom?", "Excuse me, washroom kahan hai?"]
        ], {
            question: "What should you say before asking for help?",
            options: ["Please", "Blue", "Yesterday", "Fast"],
            answer: "Please",
            hindiHint: "Madad maangte waqt polite word lagao."
        })
    ]),
    (0, content_builders_1.createLesson)(3, "Numbers, Colors, and Objects", "A0", 18, "Talk about simple counting, colors around you, and the objects in front of you.", "Ab tum room ke aas-paas ki cheezein English mein bolna start karoge: numbers, colors aur objects ke saath.", 2, [
        (0, content_builders_1.createChapter)("l03-numbers", "Numbers 1 to 20", "1 se 20 tak counting", "vocabulary", [
            ["I have two pens.", "Mere paas do pens hain."],
            ["The bus comes at five.", "Bus paanch baje aati hai."],
            ["She is eighteen years old.", "Woh atharah saal ki hai."],
            ["There are ten chairs here.", "Yahan das kursiyan hain."]
        ], {
            question: "How do you say 8 in English?",
            options: ["six", "seven", "eight", "nine"],
            answer: "eight",
            hindiHint: "Aath ka English yaad karo."
        }),
        (0, content_builders_1.createChapter)("l03-colors", "Colors Around You", "Aas-paas ke colors ko bolo", "vocabulary", [
            ["My shirt is blue.", "Meri shirt neeli hai."],
            ["The signal is red.", "Signal laal hai."],
            ["She likes green bangles.", "Use hara chudiyaan pasand hain."],
            ["This wall is white.", "Yeh deewar safed hai."]
        ], {
            question: "Which color is used in stop signals?",
            options: ["red", "green", "white", "pink"],
            answer: "red",
            hindiHint: "Traffic signal socho."
        }),
        (0, content_builders_1.createChapter)("l03-this-that", "This, That, These, Those", "Paas aur door wali cheezon ko bolo", "grammar", [
            ["This pen is mine.", "Yeh pen mera hai."],
            ["That fan is old.", "Woh pankha purana hai."],
            ["These books are new.", "Yeh kitaabein nayi hain."],
            ["Those boxes are heavy.", "Woh boxes bhaari hain."]
        ], {
            question: "Which word is used for one thing near you?",
            options: ["this", "that", "those", "them"],
            answer: "this",
            hindiHint: "Ek cheez aur paas dono yaad rakho."
        })
    ]),
    (0, content_builders_1.createLesson)(4, "Greetings and Goodbyes", "A0", 16, "Start and end basic conversations politely in social and public situations.", "Kisi se milte waqt kya bolna hai aur nikalte waqt kaise politely close karna hai, yeh lesson usi confidence ke liye hai.", 3, [
        (0, content_builders_1.createChapter)("l04-greetings", "Common Greetings", "Milte waqt bole jaane wale greetings", "vocabulary", [
            ["Hello, how are you?", "Hello, aap kaise ho?"],
            ["Good morning, sir.", "Good morning, sir."],
            ["Nice to meet you.", "Aapse milkar achha laga."],
            ["Hi, I am Aisha.", "Hi, main Aisha hoon."]
        ], {
            question: "Which greeting is best in the morning?",
            options: ["Good morning", "Good night", "Goodbye", "Sorry"],
            answer: "Good morning",
            hindiHint: "Subah ke time ka greeting socho."
        }),
        (0, content_builders_1.createChapter)("l04-questions-after-greeting", "Small Questions After Greeting", "Greeting ke baad chhote questions", "speaking", [
            ["How are you today?", "Aaj aap kaise ho?"],
            ["Where are you from?", "Aap kahan se ho?"],
            ["Are you new here?", "Kya aap yahan naye ho?"],
            ["What is your name?", "Aapka naam kya hai?"]
        ], {
            question: "Which question asks about someone's place?",
            options: ["Where are you from?", "How are you?", "What is your name?", "Are you busy?"],
            answer: "Where are you from?",
            hindiHint: "Place ya shehar puchne wala question chuno."
        }),
        (0, content_builders_1.createChapter)("l04-goodbyes", "Goodbyes and Leaving Politely", "Baat khatam karte waqt kya bolna hai", "listening", [
            ["Goodbye, see you tomorrow.", "Goodbye, kal milte hain."],
            ["Take care on the way home.", "Ghar jaate waqt apna dhyan rakhna."],
            ["See you later, Priya.", "Baad mein milte hain, Priya."],
            ["Have a nice day.", "Aapka din achha ho."]
        ], {
            question: "Which phrase is used when you leave politely?",
            options: ["Take care", "Count slowly", "Open the bag", "Write fast"],
            answer: "Take care",
            hindiHint: "Jaate waqt bolne wali polite line chuno."
        })
    ]),
    (0, content_builders_1.createLesson)(5, "Introduce Yourself", "A1", 24, "Say your name, city, work, and interests in a clean beginner introduction.", "Ab tum apna naam, shehar, kaam aur hobbies ko milaakar ek proper self-introduction bolna seekhoge.", 4, [
        (0, content_builders_1.createChapter)("l05-name-city", "Name and City", "Naam aur shehar batana", "speaking", [
            ["My name is Rohan.", "Mera naam Rohan hai."],
            ["I am from Lucknow.", "Main Lucknow se hoon."],
            ["I live in Kanpur now.", "Main ab Kanpur mein rehta hoon."],
            ["I am twenty-two years old.", "Main baais saal ka hoon."]
        ], {
            question: "Which sentence tells your city?",
            options: ["I am from Lucknow.", "My name is Rohan.", "I like music.", "I work in sales."],
            answer: "I am from Lucknow.",
            hindiHint: "Shehar batane wali line chuno."
        }),
        (0, content_builders_1.createChapter)("l05-work-study", "Work or Study Introduction", "Apna kaam ya padhai batana", "grammar", [
            ["I work as a cashier.", "Main cashier ke roop mein kaam karta hoon."],
            ["I am a college student.", "Main college student hoon."],
            ["I study computer science.", "Main computer science padhta hoon."],
            ["I work in a private company.", "Main ek private company mein kaam karta hoon."]
        ], {
            question: "Which sentence talks about study?",
            options: ["I study computer science.", "I am from Jaipur.", "My name is Meena.", "I like tea."],
            answer: "I study computer science.",
            hindiHint: "Padhai wali line pe dhyan do."
        }),
        (0, content_builders_1.createChapter)("l05-hobbies", "Likes, Hobbies, and Interests", "Pasand aur hobbies batana", "vocabulary", [
            ["I enjoy listening to music.", "Mujhe music sunna pasand hai."],
            ["I like playing cricket on Sundays.", "Mujhe Sundays ko cricket khelna pasand hai."],
            ["I love reading short stories.", "Mujhe chhoti stories padhna bahut pasand hai."],
            ["Cooking is my favorite hobby.", "Cooking meri favorite hobby hai."]
        ], {
            question: "Which line talks about a hobby?",
            options: ["Cooking is my favorite hobby.", "I am from Delhi.", "I am twenty-two.", "My office is near here."],
            answer: "Cooking is my favorite hobby.",
            hindiHint: "Hobby ya interest wali line chuno."
        }),
        (0, content_builders_1.createChapter)("l05-full-introduction", "Build Your Full Introduction", "Apna full introduction jodo", "quiz", [
            ["My name is Sana and I am from Bareilly.", "Mera naam Sana hai aur main Bareilly se hoon."],
            ["I work as a teacher in a school.", "Main school mein teacher ke roop mein kaam karti hoon."],
            ["In my free time, I watch travel videos.", "Free time mein main travel videos dekhti hoon."],
            ["Nice to meet you all.", "Aapse milkar achha laga sabko."]
        ], {
            question: "What usually comes first in a self-introduction?",
            options: ["Your name", "Your favorite food", "Your salary", "Your exam marks"],
            answer: "Your name",
            hindiHint: "Introduction ka start kis cheez se hota hai?"
        })
    ]),
    (0, content_builders_1.createLesson)(6, "Talking About Your Family", "A1", 20, "Describe parents, siblings, and relationships with easy sentence patterns.", "Family ke baare mein English mein bolna daily conversation ka basic hissa hai. Yeh lesson usi ko natural banata hai.", 5, [
        (0, content_builders_1.createChapter)("l06-family-words", "Family Member Vocabulary", "Family members ke English words", "vocabulary", [
            ["My father runs a small shop.", "Mere father ek chhoti shop chalate hain."],
            ["I have one younger sister.", "Meri ek chhoti behen hai."],
            ["My cousin lives in Delhi.", "Mera cousin Delhi mein rehta hai."],
            ["My mother is very caring.", "Meri mother bahut caring hain."]
        ], {
            question: "Which word means behen?",
            options: ["brother", "mother", "sister", "cousin"],
            answer: "sister",
            hindiHint: "Behen ka English yaad karo."
        }),
        (0, content_builders_1.createChapter)("l06-relations", "Talking About Relationships", "Rishton ko sentence mein batana", "grammar", [
            ["I have two brothers.", "Mere do bhai hain."],
            ["My mother works at home.", "Meri mother ghar par kaam karti hain."],
            ["Our family lives in Sitapur.", "Hamari family Sitapur mein rehti hai."],
            ["He has one elder sister.", "Uski ek badi behen hai."]
        ], {
            question: "Which word shows possession in 'my father'?",
            options: ["my", "father", "has", "is"],
            answer: "my",
            hindiHint: "Mera ya meri batane wala word dekho."
        }),
        (0, content_builders_1.createChapter)("l06-family-speaking", "Describe Your Family in 4 Lines", "Apni family ko 4 lines mein batao", "speaking", [
            ["We are five people in my family.", "Ham family mein paanch log hain."],
            ["My brother is preparing for exams.", "Mera bhai exams ki tayari kar raha hai."],
            ["My parents support me a lot.", "Mere parents mujhe bahut support karte hain."],
            ["We eat dinner together every night.", "Hum roz raat ko saath dinner karte hain."]
        ], {
            question: "Which detail makes a family answer more personal?",
            options: ["A feeling", "A random number", "A color", "A weather word"],
            answer: "A feeling",
            hindiHint: "Personal touch ke liye emotion ya feeling add hoti hai."
        })
    ]),
    (0, content_builders_1.createLesson)(7, "Daily Routine — Present Simple", "A1", 26, "Explain your routine with time words, habit verbs, and present simple structure.", "Roz subah se raat tak kya karte ho, usse simple aur correct English mein bolna is lesson ka main target hai.", 6, [
        (0, content_builders_1.createChapter)("l07-morning-routine", "Morning Routine Vocabulary", "Subah ke routine wale words", "vocabulary", [
            ["I wake up at six.", "Main chhe baje uthta hoon."],
            ["She brushes her teeth after tea.", "Woh chai ke baad brush karti hai."],
            ["We leave home at eight.", "Hum aath baje ghar se nikalte hain."],
            ["He eats breakfast with his family.", "Woh apni family ke saath breakfast karta hai."]
        ], {
            question: "Which verb means uthna?",
            options: ["wake up", "sleep", "sit", "draw"],
            answer: "wake up",
            hindiHint: "Subah uthne wala phrase yaad karo."
        }),
        (0, content_builders_1.createChapter)("l07-present-simple", "Present Simple for Habits", "Habit batane ke liye present simple", "grammar", [
            ["I go to the gym in the evening.", "Main shaam ko gym jaata hoon."],
            ["She studies after dinner.", "Woh dinner ke baad padhti hai."],
            ["My father reads the newspaper daily.", "Mere father roz newspaper padhte hain."],
            ["We travel by bus to work.", "Hum bus se kaam par jaate hain."]
        ], {
            question: "Which tense do we use for daily habits?",
            options: ["Present simple", "Past simple", "Future tense", "Passive voice"],
            answer: "Present simple",
            hindiHint: "Roz hone wale kaam ka tense yaad karo."
        }),
        (0, content_builders_1.createChapter)("l07-frequency-words", "Time and Frequency Words", "Always, usually, sometimes ka use", "grammar", [
            ["I usually drink tea at 7 a.m.", "Main usually 7 baje chai peeta hoon."],
            ["She always reaches office on time.", "Woh hamesha time par office pahunchti hai."],
            ["We sometimes cook at home.", "Hum kabhi-kabhi ghar par khana banate hain."],
            ["He never skips breakfast.", "Woh breakfast kabhi skip nahi karta."]
        ], {
            question: "Which word means kabhi-kabhi?",
            options: ["always", "never", "sometimes", "early"],
            answer: "sometimes",
            hindiHint: "Kabhi-kabhi ke liye frequency word chuno."
        }),
        (0, content_builders_1.createChapter)("l07-full-day-speaking", "Speak About Your Full Day", "Apne poore din ka short speaking", "speaking", [
            ["In the morning, I get ready for college.", "Subah main college ke liye ready hota hoon."],
            ["In the afternoon, I attend classes.", "Dopahar mein main classes attend karta hoon."],
            ["In the evening, I help at home.", "Shaam ko main ghar par madad karta hoon."],
            ["At night, I revise and sleep early.", "Raat ko main revise karke jaldi so jaata hoon."]
        ], {
            question: "What is the best order for a routine answer?",
            options: ["Morning to night", "Night to morning", "Only one sentence", "Random points"],
            answer: "Morning to night",
            hindiHint: "Routine ko natural order mein bolo."
        })
    ]),
    (0, content_builders_1.createLesson)(8, "Asking Questions", "A1", 22, "Ask for information using WH questions, yes/no questions, and polite forms.", "Question puchhna conversation ka engine hota hai. Yeh lesson tumhe simple aur polite dono tarah ke sawaal banana sikhata hai.", 7, [
        (0, content_builders_1.createChapter)("l08-wh-words", "WH Question Words", "What, where, when, why, who, how", "vocabulary", [
            ["Where do you live?", "Aap kahan rehte ho?"],
            ["What do you do?", "Aap kya karte ho?"],
            ["When does the class start?", "Class kab start hoti hai?"],
            ["Why are you late today?", "Aaj tum late kyun ho?"]
        ], {
            question: "Which WH word asks about time?",
            options: ["who", "why", "when", "where"],
            answer: "when",
            hindiHint: "Time ya kab puchne wala word chuno."
        }),
        (0, content_builders_1.createChapter)("l08-yes-no-questions", "Yes/No Question Patterns", "Do, does, is, are ke saath questions", "grammar", [
            ["Do you work on Sundays?", "Kya tum Sundays ko kaam karte ho?"],
            ["Does she speak English at home?", "Kya woh ghar par English bolti hai?"],
            ["Are you ready for the meeting?", "Kya tum meeting ke liye ready ho?"],
            ["Is this your first job?", "Kya yeh tumhari first job hai?"]
        ], {
            question: "Which helping verb fits with 'she' in the present simple?",
            options: ["do", "does", "are", "have"],
            answer: "does",
            hindiHint: "She/He ke saath present simple question mein kaunsa helping verb aata hai?"
        }),
        (0, content_builders_1.createChapter)("l08-polite-questions", "Polite Questions for Real Life", "Polite aur soft sawaal kaise puchhein", "speaking", [
            ["Could you repeat that, please?", "Kya aap please woh dobara bol sakte hain?"],
            ["Excuse me, where is the ticket counter?", "Excuse me, ticket counter kahan hai?"],
            ["Can I sit here, please?", "Kya main yahan baith sakta hoon, please?"],
            ["Could you help me with this form?", "Kya aap is form mein meri help kar sakte hain?"]
        ], {
            question: "Which phrase makes a question polite?",
            options: ["Could you", "Give me", "Fast now", "Tell direct"],
            answer: "Could you",
            hindiHint: "Polite request wala phrase chuno."
        })
    ])
];
