const { drive } = global.utils;
const { nickNameBot } = global.GoatBot.config;
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "welcome",
    version: "8.1",
    author: "EryXenX + ARIYAN",
    category: "events"
  },

  langs: {
    en: {
      defaultWelcomeMessage:
        "𝗪𝗲𝗹𝗰𝗼𝗺𝗲 {userName} 🎉\n" +
        "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n" +
        "✦ Glad to have you here! Enjoy your stay and make great memories 🌸",

      botAddedMessage:
        "╭━━━〔 🤖 𝐁𝐎𝐓 𝐉𝐎𝐈𝐍𝐄𝐃 〕━━━╮\n\n" +
        "🌸 আমাকে আপনাদের গ্রুপে এড করার জন্য\n" +
        "অসংখ্য ধন্যবাদ। ❤️\n\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "👥 𝐆𝐑𝐎𝐔𝐏\n" +
        "➜ {threadName}\n\n" +
        "👤 𝐀𝐃𝐃𝐄𝐃 𝐁𝐘\n" +
        "➜ {inviterName}\n\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "⚠️ কোনো সমস্যা হলে,\n" +
        "আমার বসকে মেসেজ করুন।\n\n" +
        "👑 𝐁𝐎𝐒𝐒 : 𝐀𝐑𝐈𝐘𝐀𝐍\n\n" +
        "💬 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏\n" +
        "➜ 01937278213\n\n" +
        "🔵 𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊\n" +
        "➜ https://www.facebook.com/ItsAriyanSabbir?mibextid=ZbWKwL\n\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
    }
  },

  onStart: async ({
    threadsData,
    message,
    event,
    api,
    usersData,
    getLang
  }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);

    if (!threadData.settings.sendWelcomeMessage) return;

    const addedMembers =
      event.logMessageData.addedParticipants;

    const threadName =
      threadData.threadName || "Our Group";

    const prefix =
      global.utils.getPrefix(threadID);

    const inviterID = event.author;

    for (const user of addedMembers) {
      const userID = user.userFbId;
      const botID = api.getCurrentUserID();

      if (userID == botID) {
        if (nickNameBot) {
          try {
            await api.changeNickname(
              nickNameBot,
              threadID,
              botID
            );
          } catch (_) {}
        }

        let inviterName = "Unknown";

        try {
          inviterName =
            await usersData.getName(inviterID);
        } catch (_) {}

        let botCardPath = null;

        try {
          botCardPath =
            await createBotJoinedCard({
              threadName,
              inviterName,
              inviterID,
              threadID,
              api
            });
        } catch (err) {
          console.error(
            "Bot Joined Card creation failed:",
            err
          );
        }

        const caption =
          getLang("botAddedMessage", prefix)
            .replace(
              /\{threadName\}/g,
              threadName
            )
            .replace(
              /\{inviterName\}/g,
              inviterName
            );

        const form = {
          body: caption
        };

        if (
          botCardPath &&
          fs.existsSync(botCardPath)
        ) {
          form.attachment =
            fs.createReadStream(botCardPath);
        }

        await message.send(form);

        if (
          botCardPath &&
          fs.existsSync(botCardPath)
        ) {
          setTimeout(() => {
            try {
              fs.unlinkSync(botCardPath);
            } catch (_) {}
          }, 7000);
        }

        return;
      }

      const userName = user.fullName;

      let inviterName = "Unknown";

      try {
        inviterName =
          await usersData.getName(inviterID);
      } catch (_) {}

      const memberCount =
        event.participantIDs.length;

      let {
        welcomeMessage =
          getLang("defaultWelcomeMessage")
      } = threadData.data;

      welcomeMessage = welcomeMessage
        .replace(
          /\{userName\}/g,
          userName
        )
        .replace(
          /\{userTag\}/g,
          userName
        )
        .replace(
          /\{threadName\}/g,
          threadName
        )
        .replace(
          /\{memberCount\}/g,
          memberCount
        )
        .replace(
          /\{inviterName\}/g,
          inviterName
        );

      let welcomeImagePath = null;

      try {
        welcomeImagePath =
          await createWelcomeCard({
            userName,
            threadName,
            memberCount,
            inviterName,
            newUserID: userID,
            inviterID,
            threadID,
            api
          });
      } catch (err) {
        console.error(
          "Welcome image creation failed:",
          err
        );
      }

      const form = {
        body: welcomeMessage,
        mentions: [
          {
            tag: userName,
            id: userID
          }
        ]
      };

      if (
        welcomeImagePath &&
        fs.existsSync(welcomeImagePath)
      ) {
        form.attachment =
          fs.createReadStream(
            welcomeImagePath
          );
      } else if (
        threadData.data.welcomeAttachment
      ) {
        const attachments =
          threadData.data.welcomeAttachment.map(
            f => drive.getFile(f, "stream")
          );

        form.attachment =
          (
            await Promise.allSettled(
              attachments
            )
          )
            .filter(
              ({ status }) =>
                status === "fulfilled"
            )
            .map(
              ({ value }) => value
            );
      }

      await message.send(form);

      if (
        welcomeImagePath &&
        fs.existsSync(welcomeImagePath)
      ) {
        setTimeout(() => {
          try {
            fs.unlinkSync(
              welcomeImagePath
            );
          } catch (_) {}
        }, 5000);
      }
    }
  }
};

/* =========================================================
🔑 FACEBOOK ACCESS TOKEN
========================================================= */

const ACCESS_TOKEN =
  "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

/* =========================================================
📥 DOWNLOAD PROFILE
========================================================= */

async function downloadHighQualityProfile(userID) {
  try {
    const url =
      `https://graph.facebook.com/${userID}/picture` +
      `?width=500&height=500&access_token=${ACCESS_TOKEN}`;

    const res = await axios({
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeout: 10000
    });

    return Buffer.from(
      res.data,
      "binary"
    );
  } catch {
    return null;
  }
}

/* =========================================================
📥 DOWNLOAD IMAGE
========================================================= */

async function downloadImage(url) {
  try {
    const res = await axios({
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeout: 10000
    });

    return Buffer.from(
      res.data,
      "binary"
    );
  } catch {
    return null;
  }
}

/* =========================================================
👥 GROUP IMAGE
========================================================= */

async function getGroupImage(threadID, api) {
  try {
    const info =
      await api.getThreadInfo(threadID);

    if (info.imageSrc) {
      const res = await axios({
        method: "GET",
        url: info.imageSrc,
        responseType: "arraybuffer",
        timeout: 10000
      });

      return Buffer.from(
        res.data,
        "binary"
      );
    }
  } catch {}

  return null;
}

/* =========================================================
🔤 UNICODE → PLAIN
========================================================= */

function unicodeToPlain(str) {
  if (!str) return "";

  const ranges = [
    [0x1D400, 0x1D419, "A"],
    [0x1D41A, 0x1D433, "a"],
    [0x1D434, 0x1D44D, "A"],
    [0x1D44E, 0x1D467, "a"],
    [0x1D468, 0x1D481, "A"],
    [0x1D482, 0x1D49B, "a"],
    [0x1D5D4, 0x1D5ED, "A"],
    [0x1D5EE, 0x1D607, "a"],
    [0x1D63C, 0x1D655, "A"],
    [0x1D656, 0x1D66F, "a"],
    [0x1D7CE, 0x1D7D7, "0"],
    [0xFF21, 0xFF3A, "A"],
    [0xFF41, 0xFF5A, "a"],
    [0xFF10, 0xFF19, "0"],
    [0x24B6, 0x24CF, "A"],
    [0x24D0, 0x24E9, "a"]
  ];

  const singles = {
    0x1D49C: "A",
    0x212C: "B",
    0x2102: "C",
    0x2145: "D",
    0x2130: "E",
    0x2131: "F",
    0x210A: "g",
    0x210B: "H",
    0x2110: "I",
    0x2111: "I",
    0x2112: "L",
    0x2113: "l",
    0x2115: "N",
    0x2118: "P",
    0x211A: "Q",
    0x211B: "R",
    0x211C: "R",
    0x2124: "Z",
    0x2128: "Z",
    0x2070: "0",
    0x00B9: "1",
    0x00B2: "2",
    0x00B3: "3",
    0x2074: "4",
    0x2075: "5",
    0x2076: "6",
    0x2077: "7",
    0x2078: "8",
    0x2079: "9"
  };

  let result = "";

  for (const char of str) {
    const cp = char.codePointAt(0);

    if (
      singles[cp] !== undefined
    ) {
      result += singles[cp];
      continue;
    }

    let mapped = false;

    for (
      const [start, end, base]
      of ranges
    ) {
      if (
        cp >= start &&
        cp <= end
      ) {
        const baseCode =
          base.codePointAt(0);

        result +=
          String.fromCodePoint(
            baseCode +
            (cp - start)
          );

        mapped = true;
        break;
      }
    }

    if (!mapped)
      result += char;
  }

  return result;
}

function safeStr(str) {
  if (!str) return "";

  try {
    return Buffer
      .from(str, "latin1")
      .toString("utf8");
  } catch {
    return str;
  }
}

function readableText(str) {
  return unicodeToPlain(
    safeStr(str)
  );
}

/* =========================================================
🔢 ORDINAL
========================================================= */

function ordinal(n) {
  const s = [
    "th",
    "st",
    "nd",
    "rd"
  ];

  const v = n % 100;

  return (
    n +
    (
      s[(v - 20) % 10] ||
      s[v] ||
      s[0]
    )
  );
}

/* =========================================================
🔲 ROUNDED RECTANGLE
========================================================= */

function roundRect(
  ctx,
  x,
  y,
  w,
  h,
  r
) {
  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.lineTo(
    x + w - r,
    y
  );

  ctx.quadraticCurveTo(
    x + w,
    y,
    x + w,
    y + r
  );

  ctx.lineTo(
    x + w,
    y + h - r
  );

  ctx.quadraticCurveTo(
    x + w,
    y + h,
    x + w - r,
    y + h
  );

  ctx.lineTo(
    x + r,
    y + h
  );

  ctx.quadraticCurveTo(
    x,
    y + h,
    x,
    y + h - r
  );

  ctx.lineTo(
    x,
    y + r
  );

  ctx.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  );

  ctx.closePath();
}

/* =========================================================
👤 CIRCLE AVATAR
========================================================= */

function drawCircleAvatar(
  ctx,
  img,
  cx,
  cy,
  r
) {
  ctx.save();

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    r,
    0,
    Math.PI * 2
  );

  ctx.closePath();

  ctx.clip();

  ctx.drawImage(
    img,
    cx - r,
    cy - r,
    r * 2,
    r * 2
  );

  ctx.restore();
}

/* =========================================================
✍️ FIT TEXT
========================================================= */

function fitText(
  ctx,
  text,
  maxPx,
  maxSize = 34,
  minSize = 14,
  bold = true
) {
  let t = text;
  let size = maxSize;

  const w =
    bold
      ? "bold"
      : "400";

  ctx.font =
    `${w} ${size}px "Segoe UI", Arial`;

  while (
    ctx.measureText(t).width >
      maxPx &&
    size > minSize
  ) {
    size--;

    ctx.font =
      `${w} ${size}px "Segoe UI", Arial`;
  }

  if (
    ctx.measureText(t).width >
      maxPx
  ) {
    while (
      ctx.measureText(
        t + "…"
      ).width > maxPx &&
      t.length > 1
    ) {
      t = t.slice(0, -1);
    }

    t += "…";
  }

  return {
    text: t,
    size
  };
}

/* =========================================================
🤖 BOT JOINED CARD
========================================================= */

async function createBotJoinedCard({
  threadName,
  inviterName,
  inviterID,
  threadID,
  api
}) {
  const W = 1200;
  const H = 630;

  const canvas =
    createCanvas(W, H);

  const ctx =
    canvas.getContext("2d");

  async function loadProfile(uid) {
    const buf =
      await downloadHighQualityProfile(
        uid
      );

    if (buf) {
      return loadImage(buf)
        .catch(() => null);
    }

    try {
      const info =
        await api.getUserInfo([uid]);

      const src =
        info[uid]?.thumbSrc;

      if (src) {
        const b2 =
          await downloadImage(src);

        if (b2) {
          return loadImage(b2)
            .catch(() => null);
        }
      }
    } catch {}

    return null;
  }

  const [
    inviterImg,
    groupImg
  ] = await Promise.all([
    loadProfile(inviterID),

    getGroupImage(
      threadID,
      api
    ).then(
      b =>
        b
          ? loadImage(b)
              .catch(() => null)
          : null
    )
  ]);

  const safeInviter =
    readableText(inviterName);

  const safeGroup =
    readableText(threadName);

  const bg =
    ctx.createLinearGradient(
      0,
      0,
      W,
      H
    );

  bg.addColorStop(
    0,
    "#070912"
  );

  bg.addColorStop(
    0.5,
    "#0b1020"
  );

  bg.addColorStop(
    1,
    "#05060c"
  );

  ctx.fillStyle = bg;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  const glow =
    ctx.createRadialGradient(
      W / 2,
      210,
      20,
      W / 2,
      210,
      430
    );

  glow.addColorStop(
    0,
    "rgba(0,200,255,0.18)"
  );

  glow.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle =
    glow;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.save();

  ctx.shadowColor =
    "rgba(0,200,255,0.55)";

  ctx.shadowBlur = 25;

  ctx.strokeStyle =
    "rgba(0,200,255,0.35)";

  ctx.lineWidth = 3;

  roundRect(
    ctx,
    8,
    8,
    W - 16,
    H - 16,
    24
  );

  ctx.stroke();

  ctx.restore();

  ctx.textAlign =
    "center";

  ctx.font =
    'bold 58px "Segoe UI", Arial';

  const titleGrad =
    ctx.createLinearGradient(
      300,
      0,
      900,
      0
    );

  titleGrad.addColorStop(
    0,
    "#ffffff"
  );

  titleGrad.addColorStop(
    0.5,
    "#55ddff"
  );

  titleGrad.addColorStop(
    1,
    "#ffffff"
  );

  ctx.fillStyle =
    titleGrad;

  ctx.shadowColor =
    "rgba(0,210,255,0.65)";

  ctx.shadowBlur = 18;

  ctx.fillText(
    "🤖  BOT JOINED",
    W / 2,
    82
  );

  ctx.shadowBlur = 0;

  ctx.font =
    '500 18px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(255,255,255,0.55)";

  ctx.fillText(
    "THANK YOU FOR ADDING ME TO YOUR GROUP",
    W / 2,
    116
  );

  const groupX = 70;
  const groupY = 155;
  const boxW = W - 140;
  const boxH = 150;

  ctx.fillStyle =
    "rgba(255,255,255,0.035)";

  roundRect(
    ctx,
    groupX,
    groupY,
    boxW,
    boxH,
    22
  );

  ctx.fill();

  ctx.strokeStyle =
    "rgba(255,255,255,0.08)";

  ctx.lineWidth = 1.5;

  roundRect(
    ctx,
    groupX,
    groupY,
    boxW,
    boxH,
    22
  );

  ctx.stroke();

  const groupSize = 110;

  const groupCX =
    groupX + 75;

  const groupCY =
    groupY + 75;

  if (groupImg) {
    ctx.save();

    ctx.shadowColor =
      "rgba(0,210,255,0.45)";

    ctx.shadowBlur = 20;

    roundRect(
      ctx,
      groupCX - groupSize / 2,
      groupCY - groupSize / 2,
      groupSize,
      groupSize,
      20
    );

    ctx.clip();

    ctx.drawImage(
      groupImg,
      groupCX - groupSize / 2,
      groupCY - groupSize / 2,
      groupSize,
      groupSize
    );

    ctx.restore();
  } else {
    ctx.fillStyle =
      "#171c2d";

    roundRect(
      ctx,
      groupCX - groupSize / 2,
      groupCY - groupSize / 2,
      groupSize,
      groupSize,
      20
    );

    ctx.fill();

    ctx.font =
      "48px Arial";

    ctx.fillStyle =
      "rgba(255,255,255,0.25)";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "👥",
      groupCX,
      groupCY + 17
    );
  }

  ctx.textAlign =
    "left";

  ctx.font =
    '500 14px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(0,210,255,0.7)";

  ctx.fillText(
    "GROUP",
    groupX + 155,
    groupY + 43
  );

  const groupFit =
    fitText(
      ctx,
      safeGroup,
      boxW - 205,
      34,
      16,
      true
    );

  ctx.font =
    `bold ${groupFit.size}px "Segoe UI", Arial`;

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    groupFit.text,
    groupX + 155,
    groupY + 88
  );

  ctx.font =
    '400 15px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(255,255,255,0.45)";

  ctx.fillText(
    "Bot has successfully joined this group",
    groupX + 155,
    groupY + 118
  );

  const invX = 70;
  const invY = 335;
  const invW = W - 140;
  const invH = 130;

  ctx.fillStyle =
    "rgba(255,255,255,0.035)";

  roundRect(
    ctx,
    invX,
    invY,
    invW,
    invH,
    22
  );

  ctx.fill();

  ctx.strokeStyle =
    "rgba(255,215,0,0.16)";

  roundRect(
    ctx,
    invX,
    invY,
    invW,
    invH,
    22
  );

  ctx.stroke();

  const avatarR = 45;

  const avatarCX =
    invX + 70;

  const avatarCY =
    invY + 65;

  if (inviterImg) {
    ctx.save();

    ctx.shadowColor =
      "rgba(255,215,0,0.55)";

    ctx.shadowBlur = 20;

    ctx.strokeStyle =
      "rgba(255,215,0,0.8)";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
      avatarCX,
      avatarCY,
      avatarR + 5,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();

    drawCircleAvatar(
      ctx,
      inviterImg,
      avatarCX,
      avatarCY,
      avatarR
    );
  } else {
    ctx.fillStyle =
      "#171c2d";

    ctx.beginPath();

    ctx.arc(
      avatarCX,
      avatarCY,
      avatarR,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.font =
      "30px Arial";

    ctx.fillStyle =
      "rgba(255,255,255,0.25)";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "👤",
      avatarCX,
      avatarCY + 11
    );
  }

  ctx.textAlign =
    "left";

  ctx.font =
    '500 14px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(255,215,0,0.75)";

  ctx.fillText(
    "ADDED BY",
    invX + 145,
    invY + 43
  );

  const inviterFit =
    fitText(
      ctx,
      safeInviter,
      invW - 200,
      32,
      16,
      true
    );

  ctx.font =
    `bold ${inviterFit.size}px "Segoe UI", Arial`;

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    inviterFit.text,
    invX + 145,
    invY + 82
  );

  const infoX = 70;
  const infoY = 490;
  const infoW = W - 140;
  const infoH = 100;

  const infoGrad =
    ctx.createLinearGradient(
      infoX,
      infoY,
      infoX + infoW,
      infoY
    );

  infoGrad.addColorStop(
    0,
    "rgba(0,200,255,0.08)"
  );

  infoGrad.addColorStop(
    0.5,
    "rgba(120,80,255,0.10)"
  );

  infoGrad.addColorStop(
    1,
    "rgba(0,255,160,0.06)"
  );

  ctx.fillStyle =
    infoGrad;

  roundRect(
    ctx,
    infoX,
    infoY,
    infoW,
    infoH,
    20
  );

  ctx.fill();

  ctx.textAlign =
    "center";

  ctx.font =
    'bold 20px "Segoe UI", Arial';

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "👑  BOSS : ARIYAN",
    W / 2,
    infoY + 32
  );

  ctx.font =
    '500 15px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(255,255,255,0.62)";

  ctx.fillText(
    "WhatsApp : 01937278213   •   Facebook : ARIYAN",
    W / 2,
    infoY + 62
  );

  ctx.font =
    '500 13px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(255,255,255,0.32)";

  ctx.fillText(
    "Designed & Powered By EryXenX + ARIYAN",
    W / 2,
    H - 18
  );

  const tempPath =
    path.join(
      __dirname,
      `temp_bot_joined_${Date.now()}.png`
    );

  await fs.writeFile(
    tempPath,
    canvas.toBuffer("image/png")
  );

  return tempPath;
}

/* =========================================================
🎨 ORIGINAL NEW MEMBER CARD
========================================================= */

async function createWelcomeCard({
  userName,
  threadName,
  memberCount,
  inviterName,
  newUserID,
  inviterID,
  threadID,
  api
}) {
  const W = 1200;
  const H = 630;

  const canvas =
    createCanvas(W, H);

  const ctx =
    canvas.getContext("2d");

  async function loadProfile(uid) {
    const buf =
      await downloadHighQualityProfile(
        uid
      );

    if (buf) {
      return loadImage(buf)
        .catch(() => null);
    }

    try {
      const info =
        await api.getUserInfo([uid]);

      const src =
        info[uid]?.thumbSrc;

      if (src) {
        const b2 =
          await downloadImage(src);

        if (b2) {
          return loadImage(b2)
            .catch(() => null);
        }
      }
    } catch {}

    return null;
  }

  const [
    newUserImg,
    inviterImg,
    groupImg
  ] = await Promise.all([
    loadProfile(newUserID),
    loadProfile(inviterID),

    getGroupImage(
      threadID,
      api
    ).then(
      b =>
        b
          ? loadImage(b)
              .catch(() => null)
          : null
    )
  ]);

  const safeUser =
    readableText(userName);

  const safeInviter =
    readableText(inviterName);

  const safeGroup =
    readableText(threadName);

  ctx.fillStyle =
    "#09090f";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  const rng = s => {
    let x =
      Math.sin(s) * 10000;

    return x -
      Math.floor(x);
  };

  ctx.fillStyle =
    "rgba(255,255,255,0.014)";

  for (
    let i = 0;
    i < 280;
    i++
  ) {
    ctx.beginPath();

    ctx.arc(
      rng(i * 2.3) * W,
      rng(i * 4.7) * H,
      rng(i * 7.1) * 1.3 + 0.2,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  const splitX =
    Math.round(
      W * 0.385
    );

  const PAD = 44;

  ctx.fillStyle =
    "#0d0d16";

  ctx.fillRect(
    0,
    0,
    splitX,
    H
  );

  {
    const g =
      ctx.createLinearGradient(
        splitX - 1,
        0,
        splitX + 28,
        0
      );

    g.addColorStop(
      0,
      "rgba(255,255,255,0.10)"
    );

    g.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.fillStyle = g;

    ctx.fillRect(
      splitX - 1,
      0,
      30,
      H
    );
  }

  {
    const lh =
      H * 0.52;

    const ly =
      (H - lh) / 2;

    const g =
      ctx.createLinearGradient(
        0,
        ly,
        0,
        ly + lh
      );

    g.addColorStop(
      0,
      "rgba(46,204,113,0)"
    );

    g.addColorStop(
      0.4,
      "rgba(46,204,113,0.8)"
    );

    g.addColorStop(
      0.6,
      "rgba(46,204,113,0.8)"
    );

    g.addColorStop(
      1,
      "rgba(46,204,113,0)"
    );

    ctx.fillStyle = g;

    ctx.fillRect(
      0,
      ly,
      3,
      lh
    );
  }

  {
    const rCX =
      splitX +
      (W - splitX) * 0.5;

    const g =
      ctx.createRadialGradient(
        rCX,
        H * 0.42,
        0,
        rCX,
        H * 0.42,
        380
      );

    g.addColorStop(
      0,
      "rgba(50,110,255,0.055)"
    );

    g.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );

    ctx.fillStyle = g;

    ctx.fillRect(
      splitX,
      0,
      W - splitX,
      H
    );
  }

  ctx.save();

  ctx.shadowColor =
    "rgba(80,160,255,0.28)";

  ctx.shadowBlur = 22;

  ctx.strokeStyle =
    "rgba(80,160,255,0.2)";

  ctx.lineWidth = 2;

  roundRect(
    ctx,
    6,
    6,
    W - 12,
    H - 12,
    18
  );

  ctx.stroke();

  ctx.restore();

  const leftCX =
    splitX / 2;

  const avatarR = 115;

  const avatarY =
    H / 2 - 18;

  ctx.save();

  ctx.textAlign =
    "center";

  ctx.font =
    '600 17px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(46,204,113,0.85)";

  ctx.fillText(
    "N E W   M E M B E R",
    leftCX,
    50
  );

  ctx.restore();

  ctx.save();

  ctx.shadowColor =
    "rgba(46,204,113,0.6)";

  ctx.shadowBlur = 32;

  ctx.strokeStyle =
    "rgba(46,204,113,0.9)";

  ctx.lineWidth = 3.5;

  ctx.beginPath();

  ctx.arc(
    leftCX,
    avatarY,
    avatarR + 8,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.restore();

  ctx.strokeStyle =
    "rgba(255,255,255,0.05)";

  ctx.lineWidth = 1.5;

  ctx.beginPath();

  ctx.arc(
    leftCX,
    avatarY,
    avatarR + 17,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  if (newUserImg) {
    drawCircleAvatar(
      ctx,
      newUserImg,
      leftCX,
      avatarY,
      avatarR
    );
  } else {
    ctx.fillStyle =
      "#161628";

    ctx.beginPath();

    ctx.arc(
      leftCX,
      avatarY,
      avatarR,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.save();

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.font =
      `bold ${Math.round(
        avatarR * 0.7
      )}px Arial`;

    ctx.fillStyle =
      "rgba(255,255,255,0.15)";

    ctx.fillText(
      "👤",
      leftCX,
      avatarY
    );

    ctx.restore();
  }

  {
    const maxW =
      splitX - 32;

    ctx.save();

    ctx.textAlign =
      "center";

    const {
      text,
      size
    } =
      fitText(
        ctx,
        safeUser,
        maxW,
        34,
        15
      );

    ctx.font =
      `bold ${size}px "Segoe UI", Arial`;

    ctx.fillStyle =
      "#f0f0f8";

    ctx.shadowColor =
      "rgba(0,0,0,0.7)";

    ctx.shadowBlur = 8;

    ctx.fillText(
      text,
      leftCX,
      avatarY +
        avatarR +
        40
    );

    ctx.restore();
  }

  {
    const dy =
      avatarY +
      avatarR +
      57;

    const dw =
      splitX * 0.44;

    const g =
      ctx.createLinearGradient(
        leftCX - dw / 2,
        0,
        leftCX + dw / 2,
        0
      );

    g.addColorStop(
      0,
      "transparent"
    );

    g.addColorStop(
      0.5,
      "rgba(255,255,255,0.1)"
    );

    g.addColorStop(
      1,
      "transparent"
    );

    ctx.strokeStyle = g;
    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
      leftCX - dw / 2,
      dy
    );

    ctx.lineTo(
      leftCX + dw / 2,
      dy
    );

    ctx.stroke();
  }

  {
    const bText =
      `✦  ${ordinal(memberCount)} Member  ✦`;

    ctx.save();

    ctx.font =
      'bold 17px "Segoe UI", Arial';

    ctx.textAlign =
      "center";

    const bw =
      ctx.measureText(
        bText
      ).width + 32;

    const bh = 36;

    const bx =
      leftCX - bw / 2;

    const by =
      avatarY +
      avatarR +
      70;

    const bg =
      ctx.createLinearGradient(
        bx,
        0,
        bx + bw,
        0
      );

    bg.addColorStop(
      0,
      "rgba(46,204,113,0.07)"
    );

    bg.addColorStop(
      0.5,
      "rgba(46,204,113,0.20)"
    );

    bg.addColorStop(
      1,
      "rgba(46,204,113,0.07)"
    );

    ctx.fillStyle = bg;

    roundRect(
      ctx,
      bx,
      by,
      bw,
      bh,
      9
    );

    ctx.fill();

    ctx.strokeStyle =
      "rgba(46,204,113,0.5)";

    ctx.lineWidth = 1.5;

    roundRect(
      ctx,
      bx,
      by,
      bw,
      bh,
      9
    );

    ctx.stroke();

    ctx.fillStyle =
      "rgba(46,204,113,0.92)";

    ctx.fillText(
      bText,
      leftCX,
      by + 24
    );

    ctx.restore();
  }

  const rX =
    splitX + PAD;

  const rRight =
    W - PAD;

  ctx.save();

  ctx.textAlign =
    "left";

  ctx.font =
    'bold 40px "Segoe UI", Arial';

  const wGrad =
    ctx.createLinearGradient(
      rX,
      0,
      rX + 500,
      0
    );

  wGrad.addColorStop(
    0,
    "#ffffff"
  );

  wGrad.addColorStop(
    1,
    "rgba(255,255,255,0.55)"
  );

  ctx.fillStyle =
    wGrad;

  ctx.shadowColor =
    "rgba(255,255,255,0.15)";

  ctx.shadowBlur = 12;

  ctx.fillText(
    "Welcome To Our Group",
    rX,
    90
  );

  ctx.restore();

  ctx.save();

  ctx.shadowColor =
    "rgba(100,200,255,0.8)";

  ctx.shadowBlur = 10;

  ctx.strokeStyle =
    "rgba(100,200,255,0.8)";

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(
    rX,
    102
  );

  ctx.lineTo(
    rX + 130,
    102
  );

  ctx.stroke();

  ctx.restore();

  const groupSecY = 155;
  const gAvSize = 90;

  ctx.save();

  ctx.textAlign =
    "left";

  ctx.font =
    '500 12px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(0,200,255,0.55)";

  ctx.fillText(
    "G R O U P",
    rX,
    groupSecY
  );

  ctx.restore();

  const gAx = rX;

  const gAy =
    groupSecY + 14;

  if (groupImg) {
    ctx.save();

    roundRect(
      ctx,
      gAx,
      gAy,
      gAvSize,
      gAvSize,
      16
    );

    ctx.clip();

    ctx.drawImage(
      groupImg,
      gAx,
      gAy,
      gAvSize,
      gAvSize
    );

    ctx.restore();

    ctx.save();

    ctx.strokeStyle =
      "rgba(0,200,255,0.5)";

    ctx.lineWidth = 2.5;

    roundRect(
      ctx,
      gAx,
      gAy,
      gAvSize,
      gAvSize,
      16
    );

    ctx.stroke();

    ctx.restore();
  } else {
    ctx.fillStyle =
      "#161628";

    roundRect(
      ctx,
      gAx,
      gAy,
      gAvSize,
      gAvSize,
      16
    );

    ctx.fill();

    ctx.save();

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.font =
      "44px Arial";

    ctx.fillStyle =
      "rgba(255,255,255,0.18)";

    ctx.fillText(
      "🏠",
      gAx +
        gAvSize / 2,
      gAy +
        gAvSize / 2
    );

    ctx.restore();
  }

  {
    const gTx =
      gAx +
      gAvSize +
      20;

    const gTw =
      rRight - gTx;

    const gTcY =
      gAy +
      gAvSize / 2;

    ctx.save();

    ctx.textAlign =
      "left";

    const {
      text: gn,
      size: gs
    } =
      fitText(
        ctx,
        safeGroup,
        gTw,
        34,
        14
      );

    ctx.font =
      `bold ${gs}px "Segoe UI", Arial`;

    ctx.fillStyle =
      "#e8e8f2";

    ctx.shadowColor =
      "rgba(0,0,0,0.6)";

    ctx.shadowBlur = 6;

    ctx.fillText(
      gn,
      gTx,
      gTcY +
        gs * 0.35
    );

    ctx.restore();
  }

  {
    const sy =
      gAy +
      gAvSize +
      22;

    const g =
      ctx.createLinearGradient(
        rX,
        0,
        rRight,
        0
      );

    g.addColorStop(
      0,
      "rgba(255,255,255,0.10)"
    );

    g.addColorStop(
      0.7,
      "rgba(255,255,255,0.03)"
    );

    g.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.strokeStyle = g;
    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
      rX,
      sy
    );

    ctx.lineTo(
      rRight,
      sy
    );

    ctx.stroke();
  }

  const invSecY =
    gAy +
    gAvSize +
    40;

  const invAvR = 52;

  ctx.save();

  ctx.textAlign =
    "left";

  ctx.font =
    '500 12px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(255,215,0,0.5)";

  ctx.fillText(
    "A D D E D   B Y",
    rX,
    invSecY
  );

  ctx.restore();

  const invAy =
    invSecY + 14;

  const invCX =
    rX + invAvR;

  const invCY =
    invAy + invAvR;

  if (inviterImg) {
    ctx.save();

    ctx.shadowColor =
      "rgba(255,215,0,0.4)";

    ctx.shadowBlur = 18;

    ctx.strokeStyle =
      "rgba(255,215,0,0.65)";

    ctx.lineWidth = 2.5;

    ctx.beginPath();

    ctx.arc(
      invCX,
      invCY,
      invAvR + 4,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();

    drawCircleAvatar(
      ctx,
      inviterImg,
      invCX,
      invCY,
      invAvR
    );
  } else {
    ctx.fillStyle =
      "#161628";

    ctx.beginPath();

    ctx.arc(
      invCX,
      invCY,
      invAvR,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.save();

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.font =
      "34px Arial";

    ctx.fillStyle =
      "rgba(255,255,255,0.18)";

    ctx.fillText(
      "👤",
      invCX,
      invCY
    );

    ctx.restore();
  }

  {
    const iTx =
      invCX +
      invAvR +
      20;

    const iTw =
      rRight - iTx;

    ctx.save();

    ctx.textAlign =
      "left";

    const {
      text: iname,
      size: is
    } =
      fitText(
        ctx,
        safeInviter,
        iTw,
        34,
        14
      );

    ctx.font =
      `bold ${is}px "Segoe UI", Arial`;

    ctx.fillStyle =
      "#e8e8f2";

    ctx.shadowColor =
      "rgba(0,0,0,0.6)";

    ctx.shadowBlur = 6;

    ctx.fillText(
      iname,
      iTx,
      invCY +
        is * 0.35
    );

    ctx.restore();
  }

  {
    const blockY =
      invAy +
      invAvR * 2 +
      32;

    const blockH =
      H -
      blockY -
      44;

    const g =
      ctx.createLinearGradient(
        rX,
        0,
        rRight,
        0
      );

    g.addColorStop(
      0,
      "rgba(255,255,255,0.10)"
    );

    g.addColorStop(
      0.7,
      "rgba(255,255,255,0.03)"
    );

    g.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.strokeStyle = g;
    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
      rX,
      blockY - 10
    );

    ctx.lineTo(
      rRight,
      blockY - 10
    );

    ctx.stroke();

    const pillG =
      ctx.createLinearGradient(
        rX,
        blockY,
        rRight,
        blockY + blockH
      );

    pillG.addColorStop(
      0,
      "rgba(255,255,255,0.03)"
    );

    pillG.addColorStop(
      1,
      "rgba(255,255,255,0.01)"
    );

    ctx.fillStyle =
      pillG;

    roundRect(
      ctx,
      rX,
      blockY,
      rRight - rX,
      blockH,
      14
    );

    ctx.fill();

    ctx.save();

    ctx.strokeStyle =
      "rgba(255,255,255,0.06)";

    ctx.lineWidth = 1;

    roundRect(
      ctx,
      rX,
      blockY,
      rRight - rX,
      blockH,
      14
    );

    ctx.stroke();

    ctx.restore();

    const cx =
      rX +
      (rRight - rX) / 2;

    const cy =
      blockY +
      blockH / 2;

    ctx.save();

    ctx.textAlign =
      "center";

    ctx.font =
      'bold 22px "Segoe UI", Arial';

    const pGrad =
      ctx.createLinearGradient(
        cx - 120,
        0,
        cx + 120,
        0
      );

    pGrad.addColorStop(
      0,
      "rgba(255,255,255,0.55)"
    );

    pGrad.addColorStop(
      0.4,
      "rgba(255,255,255,0.9)"
    );

    pGrad.addColorStop(
      0.65,
      "rgba(100,200,255,1)"
    );

    pGrad.addColorStop(
      1,
      "rgba(46,204,113,1)"
    );

    ctx.fillStyle =
      pGrad;

    ctx.shadowColor =
      "rgba(100,200,255,0.55)";

    ctx.shadowBlur = 16;

    ctx.fillText(
      "Powered By ARIYAN",
      cx,
      cy + 8
    );

    ctx.restore();
  }

  ctx.save();

  ctx.textAlign =
    "right";

  ctx.font =
    '400 14px "Segoe UI", Arial';

  ctx.fillStyle =
    "rgba(255,255,255,0.12)";

  ctx.fillText(
    "Enjoy your stay ✨",
    W - 28,
    H - 20
  );

  ctx.restore();

  const tempPath =
    path.join(
      __dirname,
      `temp_welcome_${Date.now()}.png`
    );

  await fs.writeFile(
    tempPath,
    canvas.toBuffer("image/png")
  );

  return tempPath;
}
