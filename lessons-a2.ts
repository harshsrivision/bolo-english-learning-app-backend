import { createChapter, createLesson, type Lesson } from "./content-builders";

export const a2Lessons: Lesson[] = [
  createLesson(
    9,
    "Shopping and Money",
    "A2",
    28,
    "Handle price questions, quantity, requests, and simple bargaining language.",
    "Market, kirana, mall ya pharmacy mein kaam aane wali English isi lesson mein hai. Price aur quantity bolna ab easy hoga.",
    8,
    [
      createChapter(
        "l09-prices-quantities",
        "Prices and Quantities",
        "Daam aur quantity bolna",
        "vocabulary",
        [
          ["How much is this shirt?", "Yeh shirt kitne ki hai?"],
          ["I need half a kilo of apples.", "Mujhe aadha kilo apples chahiye."],
          ["Two pieces are enough for me.", "Mere liye do pieces kaafi hain."],
          ["This bag costs nine hundred rupees.", "Yeh bag nau sau rupaye ka hai."]
        ],
        {
          question: "Which question asks about price?",
          options: ["How much is this?", "Where do you live?", "Why are you late?", "Who is he?"],
          answer: "How much is this?",
          hindiHint: "Daam puchne wali line chuno."
        }
      ),
      createChapter(
        "l09-shop-requests",
        "Requesting in a Shop",
        "Shop mein politely maangna",
        "speaking",
        [
          ["Can I see a bigger size?", "Kya main ek bada size dekh sakta hoon?"],
          ["Do you have this in black?", "Kya yeh black color mein hai?"],
          ["Please pack this item.", "Please is item ko pack kar dijiye."],
          ["Can you give me the bill?", "Kya aap mujhe bill de sakte hain?"]
        ],
        {
          question: "Which line asks for another color?",
          options: ["Do you have this in black?", "Please pack this item.", "I am from Agra.", "The shop is closed."],
          answer: "Do you have this in black?",
          hindiHint: "Color change maangne wali line pe dhyan do."
        }
      ),
      createChapter(
        "l09-countable-uncountable",
        "Countable and Uncountable Shopping Words",
        "Many, much, some ka use",
        "grammar",
        [
          ["How many bananas do you need?", "Tumhe kitne bananas chahiye?"],
          ["How much milk should I buy?", "Mujhe kitna milk kharidna chahiye?"],
          ["Please give me some rice.", "Please mujhe thoda rice dijiye."],
          ["We bought many notebooks today.", "Humne aaj bahut notebooks kharidi."]
        ],
        {
          question: "Which word fits with milk?",
          options: ["many", "much", "few", "those"],
          answer: "much",
          hindiHint: "Milk count nahi hota, isliye quantity word dhyan se chuno."
        }
      ),
      createChapter(
        "l09-store-roleplay",
        "Market Roleplay Review",
        "Shopping ka quick roleplay",
        "quiz",
        [
          ["Good evening, I need a formal shirt.", "Good evening, mujhe ek formal shirt chahiye."],
          ["What is the price of this one?", "Is wali ka price kya hai?"],
          ["Do you have a medium size?", "Kya medium size hai?"],
          ["Okay, I will take it.", "Theek hai, main yeh le lunga."]
        ],
        {
          question: "What usually comes after asking the price?",
          options: ["Checking size or options", "Saying good night", "Telling your age", "Talking about school"],
          answer: "Checking size or options",
          hindiHint: "Shopping flow mein agla practical step socho."
        }
      )
    ]
  ),
  createLesson(
    10,
    "Talking About the Past",
    "A2",
    30,
    "Describe finished actions from yesterday, last week, or earlier with clear verbs.",
    "Kal kya hua, pichhle hafte kya kiya, ya bachpan mein kya hota tha, uski basic English yahan se strong hogi.",
    9,
    [
      createChapter(
        "l10-past-time-words",
        "Past Time Words",
        "Yesterday, last week, ago jaise words",
        "vocabulary",
        [
          ["Yesterday, I stayed at home.", "Kal main ghar par raha."],
          ["Last week, we visited my uncle.", "Pichhle hafte hum mere uncle se milne gaye."],
          ["Two years ago, I moved to Lucknow.", "Do saal pehle main Lucknow shift hua."],
          ["In the evening, we played cards.", "Shaam ko humne cards khele."]
        ],
        {
          question: "Which phrase shows the past clearly?",
          options: ["last week", "next week", "right now", "every day"],
          answer: "last week",
          hindiHint: "Past ya beet chuke time ka signal chuno."
        }
      ),
      createChapter(
        "l10-regular-verbs",
        "Regular Verbs in the Past",
        "Worked, played, visited ka pattern",
        "grammar",
        [
          ["I worked late yesterday.", "Main kal late tak kaam kiya."],
          ["She visited her aunt on Sunday.", "Woh Sunday ko apni aunt se mili."],
          ["We played cricket after lunch.", "Humne lunch ke baad cricket khela."],
          ["They watched a movie at home.", "Unhone ghar par movie dekhi."]
        ],
        {
          question: "Which verb is the past form?",
          options: ["play", "works", "visited", "go"],
          answer: "visited",
          hindiHint: "Past form mein -ed pattern dekho."
        }
      ),
      createChapter(
        "l10-irregular-verbs",
        "Irregular Past Verbs",
        "Went, saw, ate jaise special verbs",
        "grammar",
        [
          ["I went to the bank yesterday.", "Main kal bank gaya tha."],
          ["She saw a rainbow after rain.", "Usne baarish ke baad rainbow dekha."],
          ["We ate biryani at night.", "Humne raat ko biryani khayi."],
          ["He took the metro to office.", "Woh office metro se gaya."]
        ],
        {
          question: "What is the past form of go?",
          options: ["goed", "gone", "went", "going"],
          answer: "went",
          hindiHint: "Go ka special past form yaad karo."
        }
      ),
      createChapter(
        "l10-story-speaking",
        "Tell a Short Past Story",
        "Pichhle din ki chhoti kahani sunao",
        "speaking",
        [
          ["Last Sunday, I met my school friend.", "Pichhle Sunday main apne school friend se mila."],
          ["We talked for one hour at a cafe.", "Humne ek ghante tak cafe mein baat ki."],
          ["After that, we walked to the market.", "Uske baad hum market tak chale."],
          ["It was a happy evening for me.", "Woh mere liye khush evening thi."]
        ],
        {
          question: "Which detail gives a past story a clear ending?",
          options: ["Result or feeling", "Random adjective", "New future plan", "Another greeting"],
          answer: "Result or feeling",
          hindiHint: "Story ko close karne ke liye ending detail chahiye."
        }
      )
    ]
  ),
  createLesson(
    11,
    "Making Plans — Future Tense",
    "A2",
    24,
    "Talk about weekend plans, promises, and future arrangements with confidence.",
    "Agle hafte, weekend, ya future goal ke baare mein bolne ke liye will aur going to ko simple tarike se use karna seekho.",
    10,
    [
      createChapter(
        "l11-future-words",
        "Words for Future Plans",
        "Future planning wale useful words",
        "vocabulary",
        [
          ["Tomorrow, I will call the client.", "Kal main client ko call karunga."],
          ["We plan to visit Nainital next month.", "Hum agle mahine Nainital jaane ka plan kar rahe hain."],
          ["She will prepare for the exam tonight.", "Woh aaj raat exam ki tayari karegi."],
          ["I am going to book my train ticket.", "Main apni train ticket book karne wala hoon."]
        ],
        {
          question: "Which phrase clearly talks about the future?",
          options: ["next month", "last week", "right now", "yesterday"],
          answer: "next month",
          hindiHint: "Future time signal ko pakdo."
        }
      ),
      createChapter(
        "l11-will-vs-going-to",
        "Will vs Going To",
        "Promise aur plan mein difference",
        "grammar",
        [
          ["I will help you after lunch.", "Main lunch ke baad tumhari help karunga."],
          ["We are going to shift next month.", "Hum agle mahine shift hone wale hain."],
          ["She will send the file tonight.", "Woh aaj raat file bhej degi."],
          ["I am going to start a spoken English course.", "Main spoken English course start karne wala hoon."]
        ],
        {
          question: "Which form is better for a decided plan?",
          options: ["going to", "will always", "did", "was"],
          answer: "going to",
          hindiHint: "Pehle se decide ki hui baat ke liye kaunsa form aata hai?"
        }
      ),
      createChapter(
        "l11-arrange-plan",
        "Arrange a Plan with Someone",
        "Kisi ke saath plan fix karna",
        "speaking",
        [
          ["Shall we meet on Saturday evening?", "Kya hum Saturday evening mil sakte hain?"],
          ["Let us meet near Hazratganj metro.", "Chalo Hazratganj metro ke paas milte hain."],
          ["I will message you in the morning.", "Main tumhe subah message kar dunga."],
          ["That sounds good to me.", "Mujhe yeh plan theek lag raha hai."]
        ],
        {
          question: "What should you do after suggesting a time?",
          options: ["Confirm or suggest place", "Change the topic", "Say goodbye immediately", "Talk about yesterday"],
          answer: "Confirm or suggest place",
          hindiHint: "Plan ko aage badhane ke liye agla practical step chuno."
        }
      )
    ]
  ),
  createLesson(
    12,
    "Expressing Opinions",
    "A2",
    22,
    "Share what you think, agree politely, and add a simple reason.",
    "Sirf answer dena enough nahi hota. Opinion dena aur uska reason batana conversation ko strong banata hai.",
    11,
    [
      createChapter(
        "l12-opinion-starters",
        "Opinion Starters",
        "Mere hisaab se kaise bolte hain",
        "vocabulary",
        [
          ["I think online classes are helpful.", "Mujhe lagta hai online classes helpful hain."],
          ["In my opinion, this plan is better.", "Mere hisaab se yeh plan better hai."],
          ["I feel this movie is too long.", "Mujhe lagta hai yeh movie zyada lambi hai."],
          ["I believe practice matters more than fear.", "Mera maanna hai ki practice, fear se zyada matter karti hai."]
        ],
        {
          question: "Which phrase politely starts an opinion?",
          options: ["In my opinion", "Close the door", "Two kilos", "After lunch"],
          answer: "In my opinion",
          hindiHint: "Opinion ko soft start dene wala phrase chuno."
        }
      ),
      createChapter(
        "l12-agree-disagree",
        "Agreeing and Disagreeing Politely",
        "Haan ya naa ko politely bolna",
        "grammar",
        [
          ["I agree with your point.", "Main tumhari baat se sehmat hoon."],
          ["That makes sense to me.", "Mujhe yeh baat samajh aa rahi hai."],
          ["I see your point, but I think we need more time.", "Main tumhari baat samajhta hoon, lekin mujhe lagta hai humein aur time chahiye."],
          ["I am not fully convinced yet.", "Main abhi poori tarah convinced nahi hoon."]
        ],
        {
          question: "Which sentence shows polite disagreement?",
          options: ["I see your point, but...", "You are wrong.", "No chance.", "Stop talking."],
          answer: "I see your point, but...",
          hindiHint: "Polite disagreement mein soft start hota hai."
        }
      ),
      createChapter(
        "l12-opinion-reason",
        "Give a Reason with Your Opinion",
        "Opinion ke saath reason jodo",
        "quiz",
        [
          ["I think public transport is useful because it saves money.", "Mujhe lagta hai public transport useful hai kyunki paise bachata hai."],
          ["In my opinion, practice works because confidence grows with repetition.", "Mere hisaab se practice kaam karti hai kyunki repeat karne se confidence badhta hai."],
          ["I feel this phone is expensive, so I will wait.", "Mujhe lagta hai yeh phone mehenga hai, isliye main wait karunga."],
          ["I agree because the idea is practical.", "Main sehmat hoon kyunki idea practical hai."]
        ],
        {
          question: "Which word often adds a reason?",
          options: ["because", "hello", "blue", "behind"],
          answer: "because",
          hindiHint: "Reason dene wala connector yaad karo."
        }
      )
    ]
  )
];
