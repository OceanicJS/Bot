import { checkVersion, defaultVersion } from "../util/util";
import Command from "../util/Command";
import {
    classPropertyRunner,
    classRunner,
    eventRunner,
    handleIssue,
    interfacePropertyRunner,
    methodRunner,
    typeRunner
} from "../util/docs";
import { ApplicationCommandOptionTypes, ApplicationCommandTypes, Client, CommandInteraction } from "oceanic.js";
import type { ApplicationCommandBuilder } from "@oceanicjs/builders";
import assert from "node:assert";

export default class DocsCommand extends Command {
    override description = "Get documentation for Oceanic.";
    override name = "docs";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        const version = defaultVersion;
        const check = await checkVersion(version);
        if (!check) {
            return handleIssue("loading", interaction, version, true, null, null);
        }
        const [type, subType] = interaction.data.options.getSubCommand<["class" | "event" | "method" | "type"] | ["property", "class" | "interface"]>(true);
        const name = interaction.data.options.getString("class") || interaction.data.options.getString("interface");
        switch (type) {
            case "class": {
                assert(name);
                return classRunner.call(this, interaction, name, version);
            }

            case "event": {
                assert(name);
                const event = interaction.data.options.getString("event", true);
                return eventRunner.call(this, interaction, name, event, version);
            }

            case "property": {
                assert(name && subType);
                const property = interaction.data.options.getString("property", true);
                switch (subType) {
                    case "class": {
                        return classPropertyRunner.call(this, interaction, name, property, version);
                    }
                    case "interface": {
                        return interfacePropertyRunner.call(this, interaction, name, property, version);
                    }
                    default: {
                        return;
                    }
                }
            }

            case "method": {
                assert(name);
                const method = interaction.data.options.getString("method", true);
                return methodRunner.call(this, interaction, name, method, version);
            }

            case "type": {
                const typeAlias = interaction.data.options.getString("type", true);
                return typeRunner.call(this, interaction, typeAlias, version);
            }
        }

    }

    override setOptions(command: ApplicationCommandBuilder) {
        command
            .addOption("class", ApplicationCommandOptionTypes.SUB_COMMAND, option => {
                option.setDescription("Get documentation for a class.")
                    .addOption("class", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the class to get information about.")
                            .setRequired()
                            .setAutocomplete();
                    });
            })
            .addOption("event", ApplicationCommandOptionTypes.SUB_COMMAND, option => {
                option.setDescription("Get documentation for an event.")
                    .addOption("class", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the class to get event information from.")
                            .setRequired()
                            .setAutocomplete();
                    })
                    .addOption("event", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the event to get information about.")
                            .setRequired()
                            .setAutocomplete();
                    });
            })
            .addOption("property", ApplicationCommandOptionTypes.SUB_COMMAND_GROUP, option => {
                option.setDescription("Get documentation for a property.")
                    .addOption("class", ApplicationCommandOptionTypes.SUB_COMMAND, subOption => {
                        subOption.setDescription("Get documentation for a class property.")
                            .addOption("class", ApplicationCommandOptionTypes.STRING, subSubOption => {
                                subSubOption.setDescription("The name of the class to get property information from.")
                                    .setRequired()
                                    .setAutocomplete();
                            })
                            .addOption("property", ApplicationCommandOptionTypes.STRING, subSubOption => {
                                subSubOption.setDescription("The name of the property to get information about.")
                                    .setRequired()
                                    .setAutocomplete();
                            });
                    })
                    .addOption("interface", ApplicationCommandOptionTypes.SUB_COMMAND, subOption => {
                        subOption.setDescription("Get documentation for an interface property.")
                            .addOption("interface", ApplicationCommandOptionTypes.STRING, subSubOption => {
                                subSubOption.setDescription("The name of the interface to get property information from.")
                                    .setRequired()
                                    .setAutocomplete();
                            })
                            .addOption("property", ApplicationCommandOptionTypes.STRING, subSubOption => {
                                subSubOption.setDescription("The name of the property to get information about.")
                                    .setRequired()
                                    .setAutocomplete();
                            });
                    });
            })
            .addOption("method", ApplicationCommandOptionTypes.SUB_COMMAND, option => {
                option.setDescription("Get documentation for a method.")
                    .addOption("class", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the class to get method information from.")
                            .setRequired()
                            .setAutocomplete();
                    })
                    .addOption("method", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the method to get information about.")
                            .setRequired()
                            .setAutocomplete();
                    });
            })
            .addOption("type", ApplicationCommandOptionTypes.SUB_COMMAND, option => {
                option.setDescription("Get documentation for a type.")
                    .addOption("type", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the type to get information about.")
                            .setRequired()
                            .setAutocomplete();
                    });
            });
    }
}
