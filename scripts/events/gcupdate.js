const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

fs.ensureDirSync(path.join(__dirname, "cache"));

module.exports = {
  config: {
    name: "gcupdate",
    version: "9.0",
    author: "ARIYAN SABBIR",
    description: "ARIYAN Group Update & Call Notification System",
    category: "events"
  },

  onStart: async function ({
    api,
    event,
    usersData,
    threadsData
  }) {
    const {
      type,
      logMessageType,
      logMessageData,
      author,
      senderID,
      threadID,
      action
    } = event;

    // ==================================================
    // EVENT DETECTION
    // ==================================================

    const isNameChange =
      type === "change_thread_name" ||
      logMessageType === "log:thread-name";

    const isImageChange =
      logMessageType === "log:thread-image";

    const isCallStart =
      logMessageType === "rtc_call_start" ||
      action === "rtc_call_start" ||
      type === "rtc_call_start";

    const isCallJoin =
      logMessageType === "rtc_call_join" ||
      action === "rtc_call_join" ||
      type === "rtc_call_join";

    if (
      !isNameChange &&
      !isImageChange &&
      !isCallStart &&
      !isCallJoin
    ) {
      return;
    }

    try {
      // ==================================================
      // GROUP NAME
      // ==================================================

      let threadName = "Unknown Group";

      try {
        const threadInfo =
          await api.getThreadInfo(threadID);

        threadName =
          threadInfo?.threadName ||
          "Unnamed Group";
      } catch (e) {
        try {
          const tData =
            await threadsData.get(threadID);

          threadName =
            tData?.threadName ||
            "Unnamed Group";
        } catch {}
      }

      // ==================================================
      // USER ID
      // ==================================================

      let initiatorID =
        author ||
        senderID ||
        logMessageData?.participantId ||
        logMessageData?.participantID ||
        logMessageData?.userID;

      // Call join-এর ক্ষেত্রে অনেক সময়
      // participantId আলাদা field-এ আসতে পারে
      if (
        isCallJoin &&
        !initiatorID
      ) {
        initiatorID =
          logMessageData?.callerId ||
          logMessageData?.callerID ||
          logMessageData?.actorId ||
          logMessageData?.actorID;
      }

      let userName =
        "Unknown User";

      // ==================================================
      // USER NAME
      // ==================================================

      if (initiatorID) {
        try {
          const info =
            await api.getUserInfo(
              initiatorID
            );

          if (
            info &&
            info[initiatorID]
          ) {
            userName =
              info[initiatorID].name ||
              "User";
          }
        } catch (e) {
          try {
            const userData =
              await usersData.get(
                initiatorID
              );

            userName =
              userData?.name ||
              "User";
          } catch {}
        }
      }

      // ==================================================
      // TITLE + STATUS
      // ==================================================

      let title =
        "📢 GROUP UPDATE";

      let statusText = "";

      // ==================================================
      // GROUP NAME CHANGED
      // ==================================================

      if (isNameChange) {
        const newName =
          logMessageData?.name ||
          event.logMessageData?.name ||
          "New Name";

        title =
          "✏️ GROUP NAME CHANGED";

        statusText =
          `👤 Updated By : ${userName}\n` +
          `👥 Group Name  : ${threadName}\n` +
          `📝 New Name    : ${newName}`;
      }

      // ==================================================
      // GROUP IMAGE CHANGED
      // ==================================================

      else if (isImageChange) {
        title =
          "🖼️ GROUP IMAGE CHANGED";

        statusText =
          `👤 Updated By : ${userName}\n` +
          `👥 Group Name  : ${threadName}\n` +
          `📌 Status      : গ্রুপের প্রোফাইল পিকচার আপডেট করা হয়েছে!`;
      }

      // ==================================================
      // CALL START
      // ==================================================

      else if (isCallStart) {
        title =
          "📞 CALL STARTED";

        statusText =
          `👤 Call Started By : ${userName}\n` +
          `👥 Group Name      : ${threadName}\n` +
          `⏰ Time            : ${new Date().toLocaleString(
            "en-BD",
            {
              timeZone: "Asia/Dhaka"
            }
          )}\n\n` +
          `👉 সবাই দ্রুত গ্রুপ কলে জয়েন করুন!`;
      }

      // ==================================================
      // CALL JOIN
      // ==================================================

      else if (isCallJoin) {
        title =
          "🎧 CALL JOINED";

        statusText =
          `💝 গ্রুপ কলে স্বাগতম! 🤗\n\n` +
          `👤 Member Name : ${userName}\n` +
          `👥 Group Name  : ${threadName}\n` +
          `📌 Status      : ${userName} গ্রুপ কলে যুক্ত হয়েছেন।`;
      }

      if (!statusText) {
        return;
      }

      // ==================================================
      // FINAL MESSAGE
      // ==================================================

      const alertMessage =
        `╭━━━〔 🤖 ${title} 〕━━━╮\n\n` +
        `${statusText}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👑 𝐎𝐖𝐍𝐄𝐑 : 𝐀𝐑𝐈𝐘𝐀𝐍 𝐒𝐀𝔹𝔹𝐈𝐑\n` +
        `🤖 𝐁𝐎𝐓   : 𝐀𝐑𝐈𝐘𝐀𝐍 𝐂𝐇𝐀𝐓 𝐁𝐎𝐓\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`;

      // ==================================================
      // SEND TEXT
      // ==================================================

      await new Promise(resolve => {
        api.sendMessage(
          alertMessage,
          threadID,
          err => {
            if (err) {
              console.log(
                "[GC Update] Text send error:",
                err.message
              );
            }

            resolve();
          }
        );
      });

      // ==================================================
      // OPTIONAL IMAGE CARD
      // ==================================================
      // Direct image URL ব্যবহার করা হয়েছে।
      // Image fail করলেও মূল notification বন্ধ হবে না।

      try {
        const imagePath =
          path.join(
            __dirname,
            "cache",
            `gc_${threadID}_${Date.now()}.jpg`
          );

        const imageUrl =
          "https://i.imgur.com/8Km9tLL.jpg";

        const response =
          await axios.get(
            imageUrl,
            {
              responseType:
                "arraybuffer",
              timeout: 10000
            }
          );

        if (
          response.data &&
          response.data.length > 500
        ) {
          fs.writeFileSync(
            imagePath,
            Buffer.from(
              response.data
            )
          );

          await new Promise(
            resolve => {
              api.sendMessage(
                {
                  attachment:
                    fs.createReadStream(
                      imagePath
                    )
                },
                threadID,
                err => {
                  if (err) {
                    console.log(
                      "[GC Update] Image send skipped:",
                      err.message
                    );
                  }

                  try {
                    if (
                      fs.existsSync(
                        imagePath
                      )
                    ) {
                      fs.unlinkSync(
                        imagePath
                      );
                    }
                  } catch {}

                  resolve();
                }
              );
            }
          );
        }
      } catch (imageError) {
        console.log(
          "[GC Update] Image failed, text notification kept."
        );
      }

    } catch (error) {
      console.log(
        "[GC Update] Error:",
        error.message
      );
    }
  }
};
