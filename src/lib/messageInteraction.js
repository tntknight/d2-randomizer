/**
 * Wraps a Discord.js Message to look like a slash command Interaction,
 * so prefix commands (e.g. !compare-add) can reuse the same execute() functions.
 *
 * Ephemeral replies aren't possible in messages — they're silently promoted
 * to normal replies so the command still works.
 */
export class MessageInteraction {
  constructor(message, args) {
    this.message   = message;
    this.args      = args;        // text tokens after the command name
    this.guildId   = message.guildId;
    this.user      = message.author; // has .id and .username, same as Interaction.user
    this._reply    = null;
    this.deferred  = false;
    this.replied   = false;
  }

  async reply(options) {
    if (typeof options === 'string') options = { content: options };
    const { content, embeds, files } = options;
    this._reply = await this.message.reply({ content, embeds, files });
    this.replied = true;
    return this._reply;
  }

  // deferReply sends a placeholder that editReply will later overwrite
  async deferReply(_options = {}) {
    this._reply = await this.message.reply({ content: '⏳ Processing...' });
    this.deferred = true;
  }

  async editReply(options) {
    if (typeof options === 'string') options = { content: options };
    if (this._reply) return this._reply.edit(options);
    // Fallback if somehow editReply is called without a prior reply
    this._reply = await this.message.reply(options);
    this.replied = true;
    return this._reply;
  }

  async followUp(options) {
    if (typeof options === 'string') options = { content: options };
    return this.message.channel.send(options);
  }

  get options() {
    const args        = this.args;
    const attachments = [...this.message.attachments.values()];
    return {
      // compare-add uses file1–file8; map fileN → index N-1 in the attachment list
      getAttachment(name) {
        const m = name.match(/^file(\d+)$/);
        const i = m ? parseInt(m[1], 10) - 1 : 0;
        return attachments[i] ?? null;
      },
      // compare-drop uses getString('filename'), compare-dimsearch uses getString('scope')
      getString(_name) {
        return args.length > 0 ? args.join(' ') : null;
      },
      getInteger(_name) {
        const n = parseInt(args[0], 10);
        return isNaN(n) ? null : n;
      },
    };
  }
}
