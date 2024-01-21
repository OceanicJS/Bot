import { defaultVersion } from "../util/util.js";
import { handleAutocomplete } from "../util/docs.js";
import Commands from "../util/Commands.js";
import {
    type AnyInteractionGateway,
    type Client,
    InteractionTypes,
    type CommandInteraction,
    type AutocompleteInteraction
} from "oceanic.js";
import Logger from "@uwu-codes/logger";

function stringifyArguments(interaction: CommandInteraction | AutocompleteInteraction) {
    if (interaction.data.options.raw.length === 0) {
        return null;
    }
    const [sub, subGroup] = interaction.data.options.getSubCommand() ?? [];
    let str = `${subGroup ? `${subGroup} ` : ""}${sub ? `${sub} ` : ""}`;
    switch (interaction.type) {
        case InteractionTypes.APPLICATION_COMMAND: {
            for (const arg of interaction.data.options.getOptions()) {
                str += `${arg.name}: ${String(arg.value)} `;
            }
            return str.trim();
        }

        case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE: {
            const option = interaction.data.options.getFocused();
            if (option === undefined) {
                return str.trim();
            }

            return `${str} ${option.name}: ${option.value}`.trim();
        }

        default: {
            return null;
        }
    }
}

export default async function interactionCreateEvent(this: Client, interaction: AnyInteractionGateway) {
    if (interaction.type === InteractionTypes.APPLICATION_COMMAND) {
        await interaction.defer();
        Logger.getLogger(`command/${interaction.data.name}`).info(`${interaction.user.tag} (user: ${interaction.user.id}, args: ${stringifyArguments(interaction) ?? "none"})`);
        await Commands.handle(this, interaction);
    }

    if (interaction.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE) {
        Logger.getLogger(`autocomplete/${interaction.data.name}`).info(`${interaction.user.tag} (user: ${interaction.user.id}, args: ${stringifyArguments(interaction) ?? "none"})`);
        switch (interaction.data.name) {
            case "docs":
            case "vdocs": {
                return handleAutocomplete.call(this, interaction, defaultVersion);
            }
        }
    }
}
