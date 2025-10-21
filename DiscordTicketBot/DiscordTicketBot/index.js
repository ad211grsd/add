const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: ['CHANNEL']
});

const configPath = path.join(__dirname, 'config.json');

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const saved = JSON.parse(data);
            return {
                allowedRoles: saved.allowedRoles || [],
                logChannelId: saved.logChannelId || null,
                ticketCategory: saved.ticketCategory || null,
                tickets: new Map(saved.tickets || []),
                ticketCounter: saved.ticketCounter || 1000
            };
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
    return {
        allowedRoles: [],
        logChannelId: null,
        ticketCategory: null,
        tickets: new Map(),
        ticketCounter: 1000
    };
}

function saveConfig() {
    try {
        const data = {
            allowedRoles: config.allowedRoles,
            logChannelId: config.logChannelId,
            ticketCategory: config.ticketCategory,
            tickets: Array.from(config.tickets.entries()),
            ticketCounter: ticketCounter
        };
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
    }
}

const config = loadConfig();

let ticketCounter = config.ticketCounter;

client.once('ready', () => {
    console.log(`✅ البوت جاهز! تم تسجيل الدخول كـ ${client.user.tag}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎫 White List Ticket System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            await handleCommand(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModal(interaction);
        } else if (interaction.isButton()) {
            await handleButton(interaction);
        }
    } catch (error) {
        console.error('خطأ في معالجة التفاعل:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'حدث خطأ أثناء معالجة طلبك.', ephemeral: true }).catch(() => {});
        }
    }
});

async function handleCommand(interaction) {
    const { commandName, member } = interaction;

    if (commandName === 'ttrr') {
        if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط!', ephemسeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle('🎫 نظام التذاكر | White List')
            .setDescription('**مرحباً بك في نظام التذاكر**\n\nاختر نوع التذكرة من القائمة أدناه للحصول على المساعدة.\nفريق الدعم سيتواصل معك في أقرب وقت ممكن.')
            .setThumbnail('https://i.imgur.com/qZGFqLZ.png')
            .setFooter({ text: 'White List Support System' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_menu')
                    .setPlaceholder('🎫 اختر نوع التذكرة...')
                    .addOptions([
                        {
                            label: 'استفسار',
                            description: 'لديك استفسار أو سؤال عام',
                            value: 'inquiry',
                            emoji: '❓'
                        },
                        {
                            label: 'متجر',
                            description: 'استفسار حول طلب أو مشكلة في المتجر',
                            value: 'store',
                            emoji: '🛒'
                        },
                        {
                            label: 'دعم فني',
                            description: 'مشكلة تقنية تحتاج إلى دعم فني',
                            value: 'technical',
                            emoji: '🔧'
                        }
                    ])
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }

    else if (commandName === 'uuuii') {
        if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط!', ephemeral: true });
        }

        const roleId = interaction.options.getString('role_id');
        const action = interaction.options.getString('action');

        if (action === 'add') {
            if (!config.allowedRoles.includes(roleId)) {
                config.allowedRoles.push(roleId);
                saveConfig();
                return interaction.reply({ content: `✅ تم إضافة الرتبة <@&${roleId}> إلى قائمة الرتب المسموح لها برؤية التذاكر.`, ephemeral: true });
            } else {
                return interaction.reply({ content: '⚠️ هذه الرتبة موجودة بالفعل في القائمة.', ephemeral: true });
            }
        } else if (action === 'remove') {
            const index = config.allowedRoles.indexOf(roleId);
            if (index > -1) {
                config.allowedRoles.splice(index, 1);
                saveConfig();
                return interaction.reply({ content: `✅ تم إزالة الرتبة <@&${roleId}> من قائمة الرتب المسموح لها.`, ephemeral: true });
            } else {
                return interaction.reply({ content: '⚠️ هذه الرتبة غير موجودة في القائمة.', ephemeral: true });
            }
        }
    }

    else if (commandName === 'tek') {
        const hasPermission = member.permissions.has(PermissionFlagsBits.Administrator) || 
                            member.roles.cache.some(role => config.allowedRoles.includes(role.id));

        if (!hasPermission) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية لاستخدام هذا الأمر!', ephemeral: true });
        }

        if (!interaction.channel.name || !interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: '❌ هذا الأمر يعمل فقط في قنوات التذاكر!', ephemeral: true });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_options')
                    .setPlaceholder('اختر خياراً للتذكرة...')
                    .addOptions([
                        {
                            label: 'إغلاق بسبب',
                            description: 'إغلاق التذكرة مع ذكر السبب',
                            value: 'close_with_reason',
                            emoji: '🔒'
                        },
                        {
                            label: 'إضافة شخص للتذكرة',
                            description: 'إضافة عضو لرؤية هذه التذكرة',
                            value: 'add_user',
                            emoji: '➕'
                        }
                    ])
            );

        await interaction.reply({ content: '**خيارات التذكرة:**', components: [row], ephemeral: true });
    }

    else if (commandName === 'kk') {
        if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط!', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');
        config.logChannelId = channel.id;
        saveConfig();
        
        await interaction.reply({ content: `✅ تم تعيين <#${channel.id}> كقناة لسجل التذاكر المغلقة.`, ephemeral: true });
    }
}

async function handleSelectMenu(interaction) {
    if (interaction.customId === 'ticket_menu') {
        const value = interaction.values[0];

        if (value === 'inquiry') {
            const modal = new ModalBuilder()
                .setCustomId('inquiry_modal')
                .setTitle('إنشاء تذكرة استفسار');

            const titleInput = new TextInputBuilder()
                .setCustomId('inquiry_title')
                .setLabel('عنوان الاستفسار')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('ضع عنواناً مختصراً لاستفسارك...')
                .setRequired(true)
                .setMaxLength(100);

            const descInput = new TextInputBuilder()
                .setCustomId('inquiry_desc')
                .setLabel('وصف مختصر للاستفسار')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('اكتب وصفاً مختصراً لاستفسارك...')
                .setRequired(true)
                .setMaxLength(500);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput)
            );

            await interaction.showModal(modal);
        }
        else if (value === 'store') {
            const modal = new ModalBuilder()
                .setCustomId('store_modal')
                .setTitle('إنشاء تذكرة متجر');

            const orderInput = new TextInputBuilder()
                .setCustomId('order_number')
                .setLabel('رقم الطلب (اختياري)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('أدخل رقم الطلب إذا كان متاحاً...')
                .setRequired(false)
                .setMaxLength(50);

            const issueInput = new TextInputBuilder()
                .setCustomId('store_issue')
                .setLabel('عنوان مختصر للمشكلة أو الملاحظة')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('ضع عنواناً مختصراً للمشكلة أو ملاحظتك...')
                .setRequired(true)
                .setMaxLength(500);

            modal.addComponents(
                new ActionRowBuilder().addComponents(orderInput),
                new ActionRowBuilder().addComponents(issueInput)
            );

            await interaction.showModal(modal);
        }
        else if (value === 'technical') {
            const modal = new ModalBuilder()
                .setCustomId('technical_modal')
                .setTitle('إنشاء تذكرة دعم فني');

            const titleInput = new TextInputBuilder()
                .setCustomId('tech_title')
                .setLabel('عنوان مختصر للمشكلة أو الملاحظة')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('ضع عنواناً مختصراً للمشكلة أو ملاحظتك...')
                .setRequired(true)
                .setMaxLength(500);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput)
            );

            await interaction.showModal(modal);
        }
    }
    else if (interaction.customId === 'ticket_options') {
        const value = interaction.values[0];

        if (value === 'close_with_reason') {
            const modal = new ModalBuilder()
                .setCustomId('close_reason_modal')
                .setTitle('إغلاق التذكرة');

            const reasonInput = new TextInputBuilder()
                .setCustomId('close_reason')
                .setLabel('سبب الإغلاق')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('اكتب سبب إغلاق التذكرة...')
                .setRequired(true)
                .setMaxLength(500);

            modal.addComponents(
                new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);
        }
        else if (value === 'add_user') {
            const modal = new ModalBuilder()
                .setCustomId('add_user_modal')
                .setTitle('إضافة شخص للتذكرة');

            const userInput = new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('معرف العضو (User ID)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('أدخل معرف العضو...')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(userInput)
            );

            await interaction.showModal(modal);
        }
    }
}

async function handleModal(interaction) {
    if (interaction.customId === 'inquiry_modal' || interaction.customId === 'store_modal' || interaction.customId === 'technical_modal') {
        await interaction.deferReply({ ephemeral: true });

        let ticketType = '';
        let ticketEmoji = '';
        let details = '';

        if (interaction.customId === 'inquiry_modal') {
            ticketType = 'استفسار';
            ticketEmoji = '❓';
            const title = interaction.fields.getTextInputValue('inquiry_title');
            const desc = interaction.fields.getTextInputValue('inquiry_desc');
            details = `**العنوان:** ${title}\n**الوصف:** ${desc}`;
        }
        else if (interaction.customId === 'store_modal') {
            ticketType = 'متجر';
            ticketEmoji = '🛒';
            const orderNum = interaction.fields.getTextInputValue('order_number') || 'غير محدد';
            const issue = interaction.fields.getTextInputValue('store_issue');
            details = `**رقم الطلب:** ${orderNum}\n**المشكلة/الملاحظة:** ${issue}`;
        }
        else if (interaction.customId === 'technical_modal') {
            ticketType = 'دعم فني';
            ticketEmoji = '🔧';
            const title = interaction.fields.getTextInputValue('tech_title');
            details = `**المشكلة/الملاحظة:** ${title}`;
        }

        const ticketId = `TICKET-${ticketCounter++}`;
        
        try {
            await createTicket(interaction, ticketType, ticketEmoji, details, ticketId);
            await interaction.editReply({ content: '✅ تم إنشاء تذكرتك بنجاح! تحقق من رسائلك الخاصة.', ephemeral: true });
        } catch (error) {
            if (error.message === 'DM_CLOSED') {
                await interaction.editReply({ 
                    content: '❌ لا يمكن إرسال رسائل خاصة إليك!\n\n**الحل:**\n1. افتح إعدادات السيرفر\n2. الخصوصية والأمان\n3. فعّل "السماح بالرسائل الخاصة من أعضاء السيرفر"\n4. حاول مرة أخرى', 
                    ephemeral: true 
                });
            } else {
                throw error;
            }
        }
    }
    else if (interaction.customId === 'close_reason_modal') {
        const reason = interaction.fields.getTextInputValue('close_reason');
        await closeTicket(interaction, reason);
    }
    else if (interaction.customId === 'add_user_modal') {
        const userId = interaction.fields.getTextInputValue('user_id');
        await addUserToTicket(interaction, userId);
    }
}

async function createTicket(interaction, ticketType, ticketEmoji, details, ticketId) {
    const user = interaction.user;
    const guild = interaction.guild;

    try {
        const dmEmbed = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle(`${ticketEmoji} تم إنشاء التذكرة | ${ticketId}`)
            .setDescription(`**نوع التذكرة:** ${ticketType}\n\n${details}\n\n━━━━━━━━━━━━━━━━━━━━━━\n**أهلاً! كيف أقدر أخدمك؟**\n\nيمكنك الرد هنا وسيتم إيصال رسالتك لفريق الدعم.`)
            .setFooter({ text: 'White List Support System' })
            .setTimestamp();

        try {
            await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            throw new Error('DM_CLOSED');
        }

        const permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            }
        ];

        config.allowedRoles.forEach(roleId => {
            permissionOverwrites.push({
                id: roleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            });
        });

        const ticketChannel = await guild.channels.create({
            name: `ticket-${ticketId.toLowerCase()}`,
            type: ChannelType.GuildText,
            permissionOverwrites: permissionOverwrites
        });

        const channelEmbed = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle(`${ticketEmoji} ${ticketId} | ${ticketType}`)
            .setDescription(`**العضو:** ${user.tag} (${user.id})\n\n${details}\n\n━━━━━━━━━━━━━━━━━━━━━━\n**التذكرة جاهزة للرد**\nاكتب رسالتك هنا وسيتم إرسالها للعضو عبر الرسائل الخاصة.`)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: 'White List Support System' })
            .setTimestamp();

        await ticketChannel.send({ embeds: [channelEmbed] });

        config.tickets.set(user.id, {
            ticketId: ticketId,
            channelId: ticketChannel.id,
            userId: user.id,
            type: ticketType
        });

        config.tickets.set(ticketChannel.id, {
            ticketId: ticketId,
            channelId: ticketChannel.id,
            userId: user.id,
            type: ticketType
        });

        saveConfig();

        await user.send('**Staff:** أهلا كيف أقدر أخدمك').catch(() => {});

    } catch (error) {
        console.error('خطأ في إنشاء التذكرة:', error);
        throw error;
    }
}

async function closeTicket(interaction, reason) {
    const ticketData = config.tickets.get(interaction.channel.id);
    
    if (!ticketData) {
        return interaction.reply({ content: '❌ لم يتم العثور على بيانات التذكرة!', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const user = await client.users.fetch(ticketData.userId);
        
        const closeDM = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔒 تم إغلاق التذكرة')
            .setDescription(`**رقم التذكرة:** ${ticketData.ticketId}\n**السبب:** ${reason}\n\nشكراً لتواصلك معنا!`)
            .setFooter({ text: 'White List Support System' })
            .setTimestamp();

        await user.send({ embeds: [closeDM] }).catch(() => {});

        if (config.logChannelId) {
            const logChannel = await client.channels.fetch(config.logChannelId);
            const logEmbed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle(`📋 سجل إغلاق التذكرة`)
                .setDescription(`**رقم التذكرة:** ${ticketData.ticketId}\n**العضو:** ${user.tag} (${user.id})\n**النوع:** ${ticketData.type}\n**سبب الإغلاق:** ${reason}\n**تم الإغلاق بواسطة:** ${interaction.user.tag}`)
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }

        config.tickets.delete(ticketData.userId);
        config.tickets.delete(interaction.channel.id);
        saveConfig();

        await interaction.editReply({ content: '✅ سيتم حذف القناة خلال 5 ثوانٍ...', ephemeral: true });
        
        setTimeout(async () => {
            await interaction.channel.delete();
        }, 5000);

    } catch (error) {
        console.error('خطأ في إغلاق التذكرة:', error);
        await interaction.editReply({ content: '❌ حدث خطأ أثناء إغلاق التذكرة.', ephemeral: true });
    }
}

async function addUserToTicket(interaction, userId) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const member = await interaction.guild.members.fetch(userId);
        
        await interaction.channel.permissionOverwrites.create(member, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        await interaction.editReply({ content: `✅ تم إضافة ${member.user.tag} إلى التذكرة.`, ephemeral: true });
        
        await interaction.channel.send(`➕ تمت إضافة ${member} إلى التذكرة بواسطة ${interaction.user}.`);

    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        await interaction.editReply({ content: '❌ فشل في إضافة المستخدم. تأكد من صحة المعرف.', ephemeral: true });
    }
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.channel.type === 1) {
        const ticketData = config.tickets.get(message.author.id);
        
        if (ticketData) {
            const ticketChannel = await client.channels.fetch(ticketData.channelId);
            
            const embed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(message.content)
                .setTimestamp();

            await ticketChannel.send({ embeds: [embed] });
        }
    }
    else if (message.channel.name && message.channel.name.startsWith('ticket-')) {
        const ticketData = config.tickets.get(message.channel.id);
        
        if (ticketData && !message.content.startsWith('/')) {
            try {
                const user = await client.users.fetch(ticketData.userId);
                
                await user.send(`**Staff:** ${message.content}`);
                
                await message.react('✅');
            } catch (error) {
                console.error('خطأ في إرسال الرسالة:', error);
                await message.react('❌');
            }
        }
    }
});

async function handleButton(interaction) {
}

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error('❌ لم يتم العثور على DISCORD_BOT_TOKEN في متغيرات البيئة!');
    console.log('📝 الرجاء إضافة توكن البوت في الأسرار (Secrets)');
    process.exit(1);
}

client.login(token).catch(err => {
    console.error('❌ فشل تسجيل الدخول:', err.message);
    process.exit(1);
});
