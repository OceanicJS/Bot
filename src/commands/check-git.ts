import Command from "../util/Command";
import runGit from "../util/git";
import { ApplicationCommandTypes, Client, CommandInteraction, MessageFlags } from "oceanic.js";

export default class CheckGitCommand extends Command {
    override description = "Check Discord's github for updates.";
    override name = "check-git";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        if (interaction.user.id !== "242843345402069002") {
            return interaction.createMessage({ content: "Sike" });
        } else {
            await interaction.defer(MessageFlags.EPHEMERAL);
            await runGit.call(this);
            await interaction.createFollowup({ content: "Done" });
        }
    }
}
