const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // مهم جداً لإعطاء الرتب
    ] 
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// إرسال حالة القطاعات للموقع
app.get('/status', (req, res) => {
    res.json({ gang: config.GANG_STATUS, police: config.POLICE_STATUS, staff: config.STAFF_STATUS });
});

// استقبال التقديم من الموقع
app.post('/submit', async (req, res) => {
    const { type, userId, rblx, q1, q2 } = req.body;
    
    try {
        const channel = await client.channels.fetch(config.ADMIN_CHANNEL_ID);
        const embed = new EmbedBuilder()
            .setTitle(`تقديم جديد: ${type.toUpperCase()}`)
            .setColor(0xffcc00)
            .addFields(
                { name: "👤 اسم روبلوكس", value: rblx, inline: true },
                { name: "🆔 آيدي الديسكورد", value: userId, inline: true },
                { name: "📄 القسم الأول/الأسئلة", value: q1 || "لا يوجد" },
                { name: "📄 القسم الثاني/التعهدات", value: q2 || "لا يوجد" }
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`approve_${type}_${userId}`).setLabel('قبول وإعطاء رتبة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`reject`).setLabel('رفض').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ embeds: [embed], components: [row] });
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("خطأ في إرسال التقديم");
    }
});

// التحكم في الأزرار (قبول/رفض)
client.on('interactionCreate', async (i) => {
    if (i.isButton()) {
        if (i.customId === 'reject') return i.message.delete();

        const [action, type, uid] = i.customId.split('_');
        try {
            const member = await i.guild.members.fetch(uid);
            let roleId = "";
            if (type === 'gang') roleId = config.GANG_ROLE_ID;
            if (type === 'police') roleId = config.POLICE_ROLE_ID;
            if (type === 'staff') roleId = config.STAFF_ROLE_ID;

            await member.roles.add(roleId);
            await i.reply({ content: `✅ تم قبول <@${uid}> وإعطاؤه الرتبة!`, ephemeral: true });
            await i.message.delete();
        } catch (e) {
            await i.reply({ content: "❌ فشل إعطاء الرتبة. تأكد من رتبة البوت وتفعيل Members Intent", ephemeral: true });
        }
    }

    if (i.isStringSelectMenu() && i.customId === 'toggle_sector') {
        const [sector, status] = i.values[0].split('_');
        config[`${sector.toUpperCase()}_STATUS`] = status;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
        await i.update({ content: `✅ تم تحديث حالة ${sector} إلى ${status}`, embeds: [], components: [] });
    }
});

// أوامر فتح وقفل التقديمات
client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith('-')) return;
    if (msg.content === '-فتح' || msg.content === '-قفل') {
        const isOpening = msg.content === '-فتح';
        const menu = new StringSelectMenuBuilder()
            .setCustomId('toggle_sector')
            .setPlaceholder('اختر القطاع للتعديل...')
            .addOptions(
                { label: 'العصابة', value: `gang_${isOpening ? 'open' : 'closed'}` },
                { label: 'الشرطة', value: `police_${isOpening ? 'open' : 'closed'}` },
                { label: 'الإدارة', value: `staff_${isOpening ? 'open' : 'closed'}` }
            );
        await msg.reply({ components: [new ActionRowBuilder().addComponents(menu)] });
    }
});

app.listen(config.PORT, () => console.log(`الموقع يعمل على بورت ${config.PORT}`));
client.login(config.TOKEN);
