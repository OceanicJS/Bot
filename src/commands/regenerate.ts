import {
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    type Client,
    type CommandInteraction,
    MessageFlags,
    Permissions,
} from "oceanic.js";

import Command from "../util/Command.js";
import { handleIssue } from "../util/docs.js";
import { Config, exists, regenerate, versions } from "../util/util.js";

import type { ApplicationCommandBuilder } from "@oceanicjs/builders";

export default class RegenerateCommand extends Command {
    override defaultMemberPermissions = Permissions.ADMINISTRATOR;
    override description = "Force regenerate the documentation for a version.";
    override name = "regenerate";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction): Promise<unknown> {
        if (interaction.user.id !== "242843345402069002") {
            return interaction.reply({ content: "Sike" });
        }

        await interaction.defer(MessageFlags.EPHEMERAL);
        const version = interaction.data.options.getString("version", true);
        if (!versions.includes(version)) {
            handleIssue("invalid", interaction, version, false, null, null); return;
        }

        await regenerate(version);

        const success = await exists(`${Config.dataDir}/docs/${version}.json`);
        return interaction.reply({
            content: success
                ? `Regenerated documentation for **${version}**.`
                : `Failed to regenerate documentation for **${version}**. Check the log channel for details.`,
        });
    }

    override setOptions(command: ApplicationCommandBuilder): void {
        command
            .addOption("version", ApplicationCommandOptionTypes.STRING, (option) => {
                option.setDescription("The version to regenerate.")
                    .setRequired()
                    .setAutocomplete();
            });
    }
}
