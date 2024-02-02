import Command from "../util/Command.js";
import runGit from "../util/git.js";
import { ApplicationCommandTypes, type Client, type CommandInteraction, MessageFlags } from "oceanic.js";

export default class CheckGitCommand extends Command {
    override description = "Check Discord's github for updates.";
    override name = "check-git";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        if (interaction.user.id === "242843345402069002") {
            await interaction.defer(MessageFlags.EPHEMERAL);
            await runGit.call(this);
            await interaction.reply({ content: "Done" });
        } else {
            return interaction.reply({ content: "Sike" });
        }
    }
}
