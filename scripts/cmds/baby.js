const axios = require("axios");

const API_URL = "https://vireonix.ai/v1/chat/completions";

// ==========================================
// 🤖 ARIYAN AI
// বাংলা + English + Banglish
// Reply Chain + Conversation Memory
// Author Protection
// No Double Reply
// ==========================================

const ORIGINAL_AUTHOR = "ARIYAN AHMED SABBIR";

const chatHistory = new Map();

// onChat duplicate protection
const chatProcessing = new Set();

// onStart duplicate protection
const commandProcessing = new Set();

// onReply duplicate protection
const replyProcessing = new Set();

const MAX_HISTORY = 12;
const HISTORY_TIMEOUT = 30 * 60 * 1000;


// ==========================================
// 🔒 AUTHOR PROTECTION
// ==========================================
function authorProtection() {
  try {
    return module.exports?.config?.author === ORIGINAL_AUTHOR;
  } catch {
    return false;
  }
}


// ==========================================
// 🛡️ SAFE LOCK
// ==========================================
function makeLock(set, event, timeout = 8000) {
  const messageID = event?.messageID;

  if (!messageID) return false;

  if (set.has(messageID)) {
    return true;
  }

  set.add(messageID);

  setTimeout(() => {
    set.delete(messageID);
  }, timeout);

  return false;
}


// ==========================================
// ⌨️ Typing Indicator
// ==========================================
async function typing(api, threadID) {
  try {
    if (api.sendTypingIndicator) {

      await api.sendTypingIndicator(
        threadID,
        true
      );

      setTimeout(async () => {
        try {
          await api.sendTypingIndicator(
            threadID,
            false
          );
        } catch {}
      }, 1200);
    }
  } catch {}
}


// ==========================================
// 🧠 Conversation Memory
// ==========================================
function getHistory(key) {

  const data = chatHistory.get(key);

  if (!data) {
    return [];
  }

  if (
    Date.now() - data.updatedAt >
    HISTORY_TIMEOUT
  ) {

    chatHistory.delete(key);

    return [];
  }

  return data.messages || [];
}


function saveHistory(key, messages) {

  chatHistory.set(key, {

    messages:
      messages.slice(-MAX_HISTORY),

    updatedAt:
      Date.now()
  });
}


// ==========================================
// 🔗 REPLY CHAIN
// ==========================================
function setReply(
  info,
  event,
  historyKey
) {

  if (!info?.messageID) {
    return;
  }

  if (!global.GoatBot?.onReply) {
    return;
  }

  global.GoatBot.onReply.set(
    info.messageID,
    {
      commandName: "baby",

      messageID:
        info.messageID,

      author:
        event.senderID,

      threadID:
        event.threadID,

      type: "reply",

      historyKey
    }
  );
}


// ==========================================
// 📩 REPLY HELPER
// ==========================================
async function sendBotReply(
  message,
  text
) {

  try {

    return await message.reply(text);

  } catch (error) {

    console.error(
      "❌ Reply Error:",
      error.message
    );

    try {

      return await message.send(text);

    } catch {

      return null;
    }
  }
}


// ==========================================
// 😂 RANDOM / CUSTOM REPLIES
// ==========================================
// এগুলো ইচ্ছামতো edit করতে পারবে
// এগুলো পরিবর্তন করলে Author Protection কাজ করবে না এমন নয়
// ==========================================
const randomReplies = [

  "𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐰𝐚𝐥𝐚𝐢𝐤𝐮𝐦 ♥",

  "বলেন sir__😌",

  "𝐁𝐨𝐥𝐨 𝐣𝐚𝐧 𝐤𝐢 𝐤𝐨𝐫𝐭𝐞 𝐩𝐚𝐫𝐢 𝐭𝐨𝐦𝐫 𝐣𝐨𝐧𝐧𝐨 🐸",

  "𝐋𝐞𝐛𝐮 𝐤𝐡𝐚𝐰 𝐝𝐚𝐤𝐭𝐞 𝐝𝐚𝐤𝐭𝐞 𝐭𝐨 𝐡𝐚𝐩𝐚𝐲 𝐠𝐞𝐬𝐨 🫴🍋",

  "𝐋𝐞𝐦𝐨𝐧 𝐭𝐮𝐬 🍋",

  "মুড়ি খাও 🫥",

  "অন্যকে নই, নিজেকে ভালোবাসতে শিখো প্রিয় 😌",

  "একা বাঁচতে শিখো দেখবে পৃথিবী অনেক সুন্দর ✨",

  "──‎ 𝐇𝐮𝐌..? 👉👈",

  "আম গাছে আম নাই ঢিল কেন মারো, তোমার সাথে প্রেম নাই বেবি কেন ডাকো 😒🐸",

  "কি হলো, মিস টিস করচ্ছো নাকি 🤣",

  "𝐓𝐫𝐮𝐬𝐭 𝐦𝐞 𝐢𝐚𝐦 ARIYAN 𝐟𝐫𝐨𝐦 SA BB IR 🧃",

  "𝗛𝗲𝘆 𝘅𝗮𝗻 𝗶𝗮𝗺 ARIYAN AI ✨",

  "𝐓𝐨𝐫 𝐣𝐧𝐧𝐨 𝐛𝐬𝐢 𝐚𝐜𝐡𝐢, 𝐣𝐥𝐝𝐢 𝐛𝐨𝐥 𝐤𝐢 𝐝𝐫𝐤𝐚𝐫 ✨",

  "একাকিত্ব মানুষকে ধীরে ধীরে শেষ করে ফেলে 🥀",

  "চা খাবেন, ঢেলে দেবো..? 😙🤏",

  "𝙜𝙤𝙥 𝙜𝙤𝙥 𝙜𝙤𝙥 🙊",

  // ========================================
  // 😂 CUSTOM REPLIES
  // ========================================

  "তোর তো বিয়ে হয় নাই বেবি পাইলি কই-🤦🏻",

  "পরকিয়া করছোছ নাকি শালা-🥲🤧",

  "তোকে ছাড়া বড় মন খারাপ লাগে 💔",

  "তোরে খুব মিস করছি জানিস? 🥺",

  "ডিসটার্ব করিস না, জামাই আদর করতেছে-🌚",

  "এত ডাকিস না এমন থাপ্পড় দিমু, পেন্টে মুইতা দিবি-😾👋🏻",

  "বেবি ডাকিস না 🍼 খাওয়া-😒👍🏻",

  "কি ডাকোস, কেন টাকা শেষ নাকি-🌚🤌🏻",

  "পিনিক ধরেছে যখন বটকে না ডেকে লেবু খান তখন🍋🐸",

  "আম্মু ডাক শালা 😾🦶🏻",

  "বেবি না ডাইকা গার্লফ্রেন্ড খুজে দে-🙃🫶🏻",

  "ডাকিস না, তারেক জিয়ার সাথে মিটিংয়ে আছি 😒🖐🏻",

  "জান কোলে নাও 😾✌🏻"
];


// ==========================================
// 🎲 RANDOM REPLY
// ==========================================
function getRandomReply() {

  return randomReplies[
    Math.floor(
      Math.random() *
      randomReplies.length
    )
  ];
}


// ==========================================
// 🧠 AI REQUEST
// ==========================================
async function askAI(
  text,
  history = []
) {

  try {

    const messages = [

      {
        role: "system",

        content:
          "You are ARIYAN AI, a friendly Messenger chatbot. " +

          "You understand Bangla, English and Banglish. " +

          "If the user writes Bangla, answer naturally in Bangla. " +

          "If the user writes English, answer naturally in English. " +

          "If the user mixes Bangla and English, reply naturally in the same style. " +

          "Remember previous conversation context when relevant. " +

          "Keep casual replies reasonably short."
      },

      ...history,

      {
        role: "user",
        content: text
      }
    ];


    const response = await axios.post(

      API_URL,

      {
        model: "auto",
        messages
      },

      {
        headers: {
          "Content-Type":
            "application/json"
        },

        timeout: 30000
      }
    );


    const answer =
      response.data
        ?.choices?.[0]
        ?.message?.content;


    if (!answer) {
      return null;
    }


    return answer.trim();

  } catch (error) {

    console.error(
      "❌ ARIYAN AI ERROR:",

      error.response?.status,

      error.response?.data ||
      error.message
    );

    return null;
  }
}


// ==========================================
// 📦 COMMAND
// ==========================================
module.exports = {

  config: {

    name: "baby",

    version: "17.0",

    author:
      "ARIYAN AHMED SABBIR",

    countDown: 2,

    role: 0,

    shortDescription: {
      en: "Chat with ARIYAN AI"
    },

    longDescription: {
      en:
        "Bangla + English AI with reply chain and conversation memory"
    },

    category: "AI",

    guide: {
      en:
        "{pn} hello\n" +
        "{pn} কেমন আছো\n" +
        "{pn} how are you"
    },

    aliases: [
      "bby",
      "bbe",
      "babe",
      "sam",
      "mari",
      "maria",
      "hippi",
      "xan",
      "bbz"
    ]
  },


  // ==========================================
  // ▶️ ON START
  // ==========================================
  onStart: async function ({
    api,
    event,
    args,
    message
  }) {

    // 🔒 Author Protection
    if (!authorProtection()) {
      console.log(
        "❌ ARIYAN AI BLOCKED: Author changed."
      );
      return;
    }


    // 🛡️ Command duplicate protection
    if (
      makeLock(
        commandProcessing,
        event
      )
    ) {
      return;
    }


    const text =
      args.join(" ").trim();


    const historyKey =
      `${event.threadID}_${event.senderID}`;


    // ========================================
    // শুধু baby লিখলে
    // ========================================
    if (!text) {

      const info =
        await sendBotReply(
          message,
          getRandomReply()
        );


      setReply(
        info,
        event,
        historyKey
      );

      return;
    }


    await typing(
      api,
      event.threadID
    );


    const history =
      getHistory(historyKey);


    const answer =
      await askAI(
        text,
        history
      );


    if (!answer) {

      await sendBotReply(
        message,
        "⚠️ ARIYAN AI এখন উত্তর দিতে পারছে না। একটু পরে আবার চেষ্টা করো।"
      );

      return;
    }


    // ========================================
    // 🧠 SAVE MEMORY
    // ========================================
    saveHistory(
      historyKey,

      [
        ...history,

        {
          role: "user",
          content: text
        },

        {
          role: "assistant",
          content: answer
        }
      ]
    );


    // ========================================
    // ⭐ USER MESSAGE-এর REPLY
    // ========================================
    const info =
      await sendBotReply(
        message,
        `🤖 ARIYAN AI\n\n${answer}`
      );


    setReply(
      info,
      event,
      historyKey
    );
  },


  // ==========================================
  // 💬 ON REPLY
  // ==========================================
  onReply: async function ({
    api,
    event,
    Reply,
    message
  }) {

    // 🔒 Author Protection
    if (!authorProtection()) {
      console.log(
        "❌ ARIYAN AI BLOCKED: Author changed."
      );
      return;
    }


    // 🛡️ Reply duplicate protection
    if (
      makeLock(
        replyProcessing,
        event
      )
    ) {
      return;
    }


    const text =
      event.body?.trim();


    if (!text) {
      return;
    }


    const historyKey =
      Reply?.historyKey ||
      `${event.threadID}_${event.senderID}`;


    await typing(
      api,
      event.threadID
    );


    const history =
      getHistory(historyKey);


    const answer =
      await askAI(
        text,
        history
      );


    if (!answer) {

      await sendBotReply(
        message,
        "⚠️ উত্তর দিতে একটু সমস্যা হচ্ছে 😵‍💫"
      );

      return;
    }


    // ========================================
    // 🧠 SAVE MEMORY
    // ========================================
    saveHistory(
      historyKey,

      [
        ...history,

        {
          role: "user",
          content: text
        },

        {
          role: "assistant",
          content: answer
        }
      ]
    );


    // ========================================
    // ⭐ USER REPLY-এর REPLY
    // ========================================
    const info =
      await sendBotReply(
        message,
        `🤖 ARIYAN AI\n\n${answer}`
      );


    // 🔗 Continue chain
    setReply(
      info,
      event,
      historyKey
    );
  },


  // ==========================================
  // 👀 ON CHAT
  // ==========================================
  onChat: async function ({
    api,
    event,
    message
  }) {

    // 🔒 Author Protection
    if (!authorProtection()) {
      console.log(
        "❌ ARIYAN AI BLOCKED: Author changed."
      );
      return;
    }


    const body =
      event.body?.trim();


    if (!body) {
      return;
    }


    // ========================================
    // 🚫 IMPORTANT
    // যদি user সরাসরি ARIYAN AI-এর message-এ
    // Reply করে, তাহলে onChat উত্তর দেবে না।
    //
    // onReply শুধু উত্তর দেবে।
    // এতে DOUBLE REPLY হবে না।
    // ========================================
    if (
      event.messageReply &&
      event.messageReply.senderID
    ) {

      try {

        const botID =
          api.getCurrentUserID();

        if (
          String(
            event.messageReply.senderID
          ) === String(botID)
        ) {
          return;
        }

      } catch {}
    }


    // ========================================
    // 🛡️ onChat duplicate protection
    // ========================================
    if (
      makeLock(
        chatProcessing,
        event
      )
    ) {
      return;
    }


    const lower =
      body.toLowerCase();


    // ========================================
    // 🎯 TRIGGERS
    // ========================================
    const triggers = [

      "baby",
      "bby",
      "bbe",
      "babe",
      "sam",
      "mari",
      "maria",
      "hippi",
      "xan",
      "bbz",
      "মারিয়া",
      "bot"

    ];


    // ========================================
    // 🎯 PREFIXES
    // ========================================
    const prefixes = [

      "baby ",
      "bby ",
      "bbe ",
      "babe ",
      "sam ",
      "mari ",
      "maria ",
      "hippi ",
      "xan ",
      "bbz ",
      "মারিয়া ",
      "bot "

    ];


    // ========================================
    // শুধু trigger
    //
    // bot
    // baby
    // maria
    // ========================================
    if (
      triggers.includes(lower)
    ) {

      const historyKey =
        `${event.threadID}_${event.senderID}`;


      const info =
        await sendBotReply(
          message,
          getRandomReply()
        );


      setReply(
        info,
        event,
        historyKey
      );


      return;
    }


    // ========================================
    // Prefix Detect
    //
    // bot hello
    // baby কেমন আছো
    // maria hi
    // ========================================
    let userMessage = null;


    for (
      const prefix of prefixes
    ) {

      if (
        lower.startsWith(prefix)
      ) {

        userMessage =
          body
            .slice(prefix.length)
            .trim();

        break;
      }
    }


    if (!userMessage) {
      return;
    }


    // ========================================
    // শুধু trigger + space
    // ========================================
    if (!userMessage.length) {

      const historyKey =
        `${event.threadID}_${event.senderID}`;


      const info =
        await sendBotReply(
          message,
          getRandomReply()
        );


      setReply(
        info,
        event,
        historyKey
      );


      return;
    }


    // ========================================
    // 🧠 AI
    // ========================================
    const historyKey =
      `${event.threadID}_${event.senderID}`;


    await typing(
      api,
      event.threadID
    );


    const history =
      getHistory(historyKey);


    const answer =
      await askAI(
        userMessage,
        history
      );


    if (!answer) {

      await sendBotReply(
        message,
        "⚠️ ARIYAN AI এখন একটু ব্যস্ত 😵‍💫"
      );

      return;
    }


    // ========================================
    // 🧠 SAVE MEMORY
    // ========================================
    saveHistory(
      historyKey,

      [
        ...history,

        {
          role: "user",
          content: userMessage
        },

        {
          role: "assistant",
          content: answer
        }
      ]
    );


    // ========================================
    // ⭐ ORIGINAL USER MESSAGE-এর REPLY
    // ========================================
    const info =
      await sendBotReply(
        message,
        `🤖 ARIYAN AI\n\n${answer}`
      );


    // 🔗 Continue chain
    setReply(
      info,
      event,
      historyKey
    );
  }
};


// ==========================================
// 🔒 FINAL AUTHOR VERIFICATION
// ==========================================
if (!authorProtection()) {

  module.exports.onStart =
    async function () {
      return;
    };

  module.exports.onReply =
    async function () {
      return;
    };

  module.exports.onChat =
    async function () {
      return;
    };

  console.log(
    "❌ ARIYAN AI: Author verification failed!"
  );
}
