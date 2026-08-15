import {
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    type Client,
    type CommandInteraction,
    Permissions,
} from "oceanic.js";

import Command from "../util/Command.js";

import type { ApplicationCommandBuilder } from "@oceanicjs/builders";

export default class EvalCommand extends Command {
    override defaultMemberPermissions = Permissions.ADMINISTRATOR;
    override description = "Evaluate some code";
    override name = "eval";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction): Promise<unknown> {
        if (interaction.user.id === "242843345402069002") {
            return interaction.reply({
                embeds: [
                    {
                        title: "Eval Result",

                        description: `\`\`\`js\n${await eval(interaction.data.options.getString("code", true))}\`\`\``,
                    },
                ],
            });
        } else {
            return interaction.reply({ content: "Sike" });
        }
    }

    override setOptions(command: ApplicationCommandBuilder): void {
        command
            .addOption("code", ApplicationCommandOptionTypes.STRING, (option) => {
                option.setDescription("The code to evaluate");
            });
    }
}
