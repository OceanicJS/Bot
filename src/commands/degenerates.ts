import Command from "../util/Command.js";
import { Config } from "../util/util.js";
import type { ApplicationCommandBuilder } from "@oceanicjs/builders";
import {
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    MessageFlags,
    type Client,
    type CommandInteraction,
    type Member
} from "oceanic.js";

const superRole = "1153797596482121778", role = "1011340058420318228";
export default class DegeneratesCommand extends Command {
    override description = "Manage the degenerates";
    override name = "degenerates";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        if (!interaction.member!.roles.includes(superRole)) {
            return interaction.createMessage({ content: "You do not have permission to use this command.", flags: MessageFlags.EPHEMERAL });
        }
        const user = interaction.data.options.getMember("user", true);
        const [action] = interaction.data.options.getSubCommand<["add" | "remove"]>(true);
        switch (action) {
            // eslint-disable-next-line unicorn/switch-case-braces
            case "add": return DegeneratesCommand.prototype.add.call(this, interaction, user);
            // eslint-disable-next-line unicorn/switch-case-braces
            case "remove": return DegeneratesCommand.prototype.remove.call(this, interaction, user);
        }
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    async add(this: Client, interaction: CommandInteraction, user: Member) {
        if (user.roles.includes(role)) {
            return interaction.createMessage({ content: "This user is already a degenerate.", flags: MessageFlags.EPHEMERAL });
        }

        await user.addRole(role, "Added by a degenerate");
        await this.rest.webhooks.execute(Config.degenerateWebhook.id, Config.degenerateWebhook.token, {
            username:  interaction.member!.displayName,
            avatarURL: interaction.member!.avatarURL(),
            content:   `${user.mention} has been dragged into degeneracy.`,
            flags:     MessageFlags.SUPPRESS_NOTIFICATIONS
        });
        return interaction.createMessage({ content: "Successfully added the user.", flags: MessageFlags.EPHEMERAL });
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    async remove(this: Client, interaction: CommandInteraction, user: Member) {
        if (!user.roles.includes(role)) {
            return interaction.createMessage({ content: "This user is not a degenerate.", flags: MessageFlags.EPHEMERAL });
        }

        if (user.roles.includes(superRole)) {
            return interaction.createMessage({ content: "You cannot remove a super degenerate.", flags: MessageFlags.EPHEMERAL });
        }

        await user.removeRole(role, "Removed by a degenerate");
        await this.rest.webhooks.execute(Config.degenerateWebhook.id, Config.degenerateWebhook.token, {
            username:  interaction.member!.displayName,
            avatarURL: interaction.member!.avatarURL(),
            content:   `${user.mention} has been removed from degeneracy.`,
            flags:     MessageFlags.SUPPRESS_NOTIFICATIONS
        });
        return interaction.createMessage({ content: "Successfully removed the user.", flags: MessageFlags.EPHEMERAL });
    }

    override setOptions(command: ApplicationCommandBuilder) {
        command
            .addOption("add", ApplicationCommandOptionTypes.SUB_COMMAND, option => {
                option.setDescription("Add a degenerate")
                    .addOption("user", ApplicationCommandOptionTypes.USER, suboption => {
                        suboption.setDescription("The user to add.")
                            .setRequired(true);
                    });
            })
            .addOption("remove", ApplicationCommandOptionTypes.SUB_COMMAND, option => {
                option.setDescription("Remove a degenerate")
                    .addOption("user", ApplicationCommandOptionTypes.USER, suboption => {
                        suboption.setDescription("The user to remove.")
                            .setRequired(true);
                    });
            });
    }
}
