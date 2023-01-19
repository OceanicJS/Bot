import Command from "../util/Command.js";
import type { ApplicationCommandBuilder } from "@oceanicjs/builders";
import {
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    type Client,
    type CommandInteraction,
    Permissions
} from "oceanic.js";

export default class EvalCommand extends Command {
    override defaultMemberPermissions = Permissions.ADMINISTRATOR;
    override description = "Evaluate some code";
    override name = "eval";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        // eslint-disable-next-line unicorn/prefer-ternary
        if (interaction.user.id === "242843345402069002") {
            return interaction.createMessage({
                embeds: [
                    {
                        title:       "Eval Result",
                        // eslint-disable-next-line no-eval, @typescript-eslint/restrict-template-expressions
                        description: `\`\`\`js\n${eval(interaction.data.options.getString("code", true))}\`\`\``
                    }
                ]
            });
        } else {
            return interaction.createMessage({ content: "Sike" });
        }
    }

    override setOptions(command: ApplicationCommandBuilder) {
        command
            .addOption("code", ApplicationCommandOptionTypes.STRING, option => {
                option.setDescription("The code to evaluate");
            });
    }
}
