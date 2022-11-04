import { defaultVersion } from "../util/util";
import { handleAutocomplete } from "../util/docs";
import Commands from "../util/Commands";
import { AnyInteractionGateway, Client, InteractionTypes } from "oceanic.js";

export default async function interactionCreateEvent(this: Client, interaction: AnyInteractionGateway) {
    if (interaction.type === InteractionTypes.APPLICATION_COMMAND) {
        console.log(`[${new Date().toISOString()}][command/${interaction.data.name}]: ${interaction.user.tag} (${interaction.user.id})`);
        await Commands.handle(this, interaction);
    }

    if (interaction.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE) {
        console.log(`[${new Date().toISOString()}][autocomplete/${interaction.data.name}]: ${interaction.user.tag} (${interaction.user.id})`);
        switch (interaction.data.name) {
            case "docs":
            case "vdocs": {
                return handleAutocomplete.call(this, interaction, defaultVersion);
            }
        }
    }
}
