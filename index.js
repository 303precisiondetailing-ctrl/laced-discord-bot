const Discord = require('discord.js');
const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Configuration
const OWNER_ID = '1130701614911586304';
const TICKET_CATEGORY_ID = '1460080874660958330';

// Bot data storage (in-memory - resets on restart)
let botData = {
    prefix: '!',
    blacklistedWords: ['fuck', 'shit', 'bitch', 'nigger', 'nigga', 'faggot', 'retard', 'cunt', 'ass', 'damn'],
    rulesChannel: null,
    ticketChannel: null,
    ticketCounter: 0
};

// Check if user is owner
function isOwner(userId) {
    return userId === OWNER_ID;
}

client.on('ready', () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    client.user.setActivity('Fallen Survival', { type: 'PLAYING' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Check for blacklisted words
    const content = message.content.toLowerCase();
    for (const word of botData.blacklistedWords) {
        if (content.includes(word.toLowerCase())) {
            try {
                await message.delete();
                const warning = await message.channel.send(`⚠️ ${message.author}, your message was deleted for containing blacklisted words.`);
                setTimeout(() => warning.delete(), 5000);
            } catch (err) {
                console.error('Error deleting message:', err);
            }
            return;
        }
    }

    if (!message.content.startsWith(botData.prefix)) return;

    const args = message.content.slice(botData.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ========== OWNER ONLY COMMANDS ==========
    
    // Rules Command
    if (command === 'rules') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!channel) {
            return message.reply('❌ Please mention a channel or provide a channel ID!');
        }

        const rulesEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('📜 Server Rules - Fallen Survival')
            .setDescription('Please read and follow all rules to ensure a positive experience for everyone.')
            .addFields(
                { name: '1️⃣ Be Respectful', value: 'Treat all members with respect. No harassment, hate speech, or discrimination.', inline: false },
                { name: '2️⃣ No NSFW Content', value: 'Keep all content appropriate for all ages. NSFW content will result in immediate action.', inline: false },
                { name: '3️⃣ No Spamming', value: 'Do not spam messages, emojis, or mentions. This includes excessive caps.', inline: false },
                { name: '4️⃣ No Advertising', value: 'Do not advertise other servers, products, or services without permission.', inline: false },
                { name: '5️⃣ No Exploiting/Hacking', value: 'Discussion or sharing of exploits, hacks, or cheats for Fallen Survival is strictly prohibited.', inline: false },
                { name: '6️⃣ No Scamming', value: 'Attempting to scam other members in trades or transactions will result in a permanent ban.', inline: false },
                { name: '7️⃣ English Only in Main Chats', value: 'Please use English in main channels to ensure everyone can participate.', inline: false },
                { name: '8️⃣ Follow Roblox ToS', value: 'All Roblox Terms of Service must be followed. No account sharing or real-money trading.', inline: false },
                { name: '9️⃣ Listen to Staff', value: 'Respect all staff decisions. If you have an issue, open a ticket.', inline: false },
                { name: '🔟 Have Fun!', value: 'Enjoy your time in Fallen Survival and our community!', inline: false }
            )
            .setFooter({ text: 'Breaking these rules may result in warnings, kicks, or bans.' })
            .setTimestamp();

        try {
            await channel.send({ embeds: [rulesEmbed] });
            botData.rulesChannel = channel.id;
            message.reply(`✅ Rules sent to ${channel}!`);
        } catch (err) {
            message.reply('❌ Failed to send rules. Check bot permissions!');
        }
    }

    // Ticket Setup Command
    else if (command === 'ticketsetup') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!channel) {
            return message.reply('❌ Please mention a channel or provide a channel ID!');
        }

        const ticketEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎫 Support Tickets')
            .setDescription('Need help? Click the button below to open a support ticket!\n\n**When to open a ticket:**\n• Report a player\n• Appeal a ban\n• Get help with Fallen Survival\n• Report bugs\n• Ask staff questions')
            .setFooter({ text: 'Tickets are monitored by staff' });

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('📩 Create Ticket')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        try {
            await channel.send({ embeds: [ticketEmbed], components: [row] });
            botData.ticketChannel = channel.id;
            message.reply(`✅ Ticket system set up in ${channel}!`);
        } catch (err) {
            message.reply('❌ Failed to set up tickets. Check bot permissions!');
        }
    }

    // Blacklist Command
    else if (command === 'blacklist') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const word = args[0];
        if (!word) {
            return message.reply(`❌ Usage: \`${botData.prefix}blacklist <word>\`\n\n**Current blacklisted words:**\n${botData.blacklistedWords.join(', ')}`);
        }

        if (botData.blacklistedWords.includes(word.toLowerCase())) {
            return message.reply('❌ That word is already blacklisted!');
        }

        botData.blacklistedWords.push(word.toLowerCase());
        message.reply(`✅ Added \`${word}\` to the blacklist!`);
    }

    // Remove from Blacklist Command
    else if (command === 'unblacklist') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const word = args[0];
        if (!word) {
            return message.reply(`❌ Usage: \`${botData.prefix}unblacklist <word>\``);
        }

        const index = botData.blacklistedWords.indexOf(word.toLowerCase());
        if (index === -1) {
            return message.reply('❌ That word is not blacklisted!');
        }

        botData.blacklistedWords.splice(index, 1);
        message.reply(`✅ Removed \`${word}\` from the blacklist!`);
    }

    // Prefix Command
    else if (command === 'prefix') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const newPrefix = args[0];
        if (!newPrefix) {
            return message.reply(`❌ Usage: \`${botData.prefix}prefix <new_prefix>\`\n\nCurrent prefix: \`${botData.prefix}\``);
        }

        botData.prefix = newPrefix;
        message.reply(`✅ Prefix changed to \`${newPrefix}\`!`);
    }

    // Clear/Purge Command
    else if (command === 'c' || command === 'clear' || command === 'purge') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('❌ Please provide a number between 1 and 100!');
        }

        try {
            await message.delete();
            const deleted = await message.channel.bulkDelete(amount, true);
            const reply = await message.channel.send(`✅ Deleted ${deleted.size} messages!`);
            setTimeout(() => reply.delete(), 3000);
        } catch (err) {
            message.reply('❌ Failed to delete messages. They may be too old (14+ days).');
        }
    }

    // Ban Command
    else if (command === 'ban') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.reply('❌ Please mention a user or provide their ID!');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.ban({ reason });
            message.reply(`✅ Banned ${member.user.tag} for: ${reason}`);
        } catch (err) {
            message.reply('❌ Failed to ban user. Check permissions and role hierarchy!');
        }
    }

    // Kick Command
    else if (command === 'kick') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.reply('❌ Please mention a user or provide their ID!');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.kick(reason);
            message.reply(`✅ Kicked ${member.user.tag} for: ${reason}`);
        } catch (err) {
            message.reply('❌ Failed to kick user. Check permissions and role hierarchy!');
        }
    }

    // Timeout/Mute Command
    else if (command === 'timeout' || command === 'mute') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const duration = parseInt(args[1]);
        
        if (!member || !duration) {
            return message.reply(`❌ Usage: \`${botData.prefix}timeout <user> <minutes>\``);
        }

        try {
            await member.timeout(duration * 60 * 1000, 'Timed out by owner');
            message.reply(`✅ Timed out ${member.user.tag} for ${duration} minutes!`);
        } catch (err) {
            message.reply('❌ Failed to timeout user!');
        }
    }

    // Announce Command
    else if (command === 'announce') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply(`❌ Usage: \`${botData.prefix}announce <#channel> <message>\``);
        }

        const announcement = args.slice(1).join(' ');
        if (!announcement) {
            return message.reply('❌ Please provide an announcement message!');
        }

        const announceEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('📢 Announcement')
            .setDescription(announcement)
            .setFooter({ text: `Announced by ${message.author.tag}` })
            .setTimestamp();

        try {
            await channel.send({ embeds: [announceEmbed] });
            message.reply(`✅ Announcement sent to ${channel}!`);
        } catch (err) {
            message.reply('❌ Failed to send announcement!');
        }
    }

    // Server Info Command
    else if (command === 'serverinfo') {
        if (!isOwner(message.author.id)) {
            return message.reply('❌ This command is owner-only!');
        }

        const guild = message.guild;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📊 ${guild.name} Server Info`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: '😊 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true }
            );

        message.reply({ embeds: [embed] });
    }

    // Help Command
    else if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#00FFFF')
            .setTitle('📖 Laced Bot Commands')
            .setDescription(`Current prefix: \`${botData.prefix}\`\n\n${isOwner(message.author.id) ? '**🔒 OWNER COMMANDS**' : '**⚠️ You do not have access to owner commands**'}`)
            .addFields(
                { name: `${botData.prefix}rules <channel>`, value: 'Send server rules to a channel', inline: false },
                { name: `${botData.prefix}ticketsetup <channel>`, value: 'Set up the ticket system', inline: false },
                { name: `${botData.prefix}blacklist <word>`, value: 'Add a word to the blacklist', inline: false },
                { name: `${botData.prefix}unblacklist <word>`, value: 'Remove a word from blacklist', inline: false },
                { name: `${botData.prefix}prefix <new>`, value: 'Change the command prefix', inline: false },
                { name: `${botData.prefix}c <amount>`, value: 'Clear messages (1-100)', inline: false },
                { name: `${botData.prefix}ban <user> [reason]`, value: 'Ban a member', inline: false },
                { name: `${botData.prefix}kick <user> [reason]`, value: 'Kick a member', inline: false },
                { name: `${botData.prefix}timeout <user> <minutes>`, value: 'Timeout a member', inline: false },
                { name: `${botData.prefix}announce <#channel> <msg>`, value: 'Send an announcement', inline: false },
                { name: `${botData.prefix}serverinfo`, value: 'View server information', inline: false }
            )
            .setFooter({ text: 'Made for Fallen Survival Community' });

        message.reply({ embeds: [helpEmbed] });
    }
});

// Handle ticket creation button
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        // Check if user already has a ticket
        const existingTicket = guild.channels.cache.find(
            ch => ch.name === `ticket-${member.user.username.toLowerCase()}` && ch.parentId === TICKET_CATEGORY_ID
        );

        if (existingTicket) {
            return interaction.reply({ content: '❌ You already have an open ticket!', ephemeral: true });
        }

        try {
            botData.ticketCounter++;
            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                    },
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎫 Support Ticket Created')
                .setDescription(`Welcome ${member}!\n\nPlease describe your issue and a staff member will assist you shortly.\n\n**Ticket Number:** #${botData.ticketCounter}`)
                .setFooter({ text: 'To close this ticket, a staff member can delete this channel' });

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Close Ticket')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });
            interaction.reply({ content: `✅ Ticket created! ${ticketChannel}`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: '❌ Failed to create ticket!', ephemeral: true });
        }
    }

    if (interaction.customId === 'close_ticket') {
        // Only owner can close tickets
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '❌ Only the server owner can close tickets!', ephemeral: true });
        }

        await interaction.reply('🔒 Closing ticket in 5 seconds...');
        setTimeout(() => {
            interaction.channel.delete();
        }, 5000);
    }
});

// Login
client.login(process.env.BOT_TOKEN);
