const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'ttrr',
        description: 'عرض نظام التذاكر للجميع (للإداريين فقط)',
    },
    {
        name: 'uuuii',
        description: 'إدارة الرتب المسموح لها برؤية التذاكر',
        options: [
            {
                name: 'action',
                description: 'الإجراء المطلوب',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'إضافة', value: 'add' },
                    { name: 'إزالة', value: 'remove' }
                ]
            },
            {
                name: 'role_id',
                description: 'معرف الرتبة (Role ID)',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'tek',
        description: 'إدارة خيارات التذكرة (للإداريين)',
    },
    {
        name: 'kk',
        description: 'تحديد قناة سجل التذاكر المغلقة',
        options: [
            {
                name: 'channel',
                description: 'القناة المراد تعيينها',
                type: ApplicationCommandOptionType.Channel,
                required: true
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('🔄 بدء تسجيل الأوامر...');

        const clientId = process.env.DISCORD_CLIENT_ID;
        
        if (!clientId) {
            console.error('❌ لم يتم العثور على DISCORD_CLIENT_ID في متغيرات البيئة!');
            process.exit(1);
        }

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('✅ تم تسجيل الأوامر بنجاح!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        console.log('الأوامر المسجلة:');
        commands.forEach(cmd => console.log(`  /${cmd.name} - ${cmd.description}`));
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الأوامر:', error);
    }
})();
