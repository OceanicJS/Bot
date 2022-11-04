import { checkVersion, versions } from "../util/util";
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
    override description = "Get version specific documentation for Oceanic.";
    override name = "vdocs";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        const version = interaction.data.options.getString("version", true);
        if (!versions.includes(version)) {
            return void handleIssue("invalid", interaction, version, true, null, null);
        }
        const check = await checkVersion(version);
        if (!check) {
            return handleIssue("loading", interaction, version, true, null, null);
        }
        const [type, subType] = interaction.data.options.getSubCommand<["class" | "event" | "method" | "type"] | ["property", "class" | "interface"]>(true);
        const className = interaction.data.options.getString("class");
        switch (type) {
            case "class": {
                assert(className);
                return classRunner.call(this, interaction, className, version);
            }

            case "event": {
                assert(className);
                const event = interaction.data.options.getString("event", true);
                return eventRunner.call(this, interaction, className, event, version);
            }

            case "property": {
                assert(className && subType);
                const property = interaction.data.options.getString("property", true);
                switch (subType) {
                    case "class": {
                        return classPropertyRunner.call(this, interaction, className, property, version);
                    }
                    case "interface": {
                        return interfacePropertyRunner.call(this, interaction, className, property, version);
                    }
                    default: {
                        return;
                    }
                }
            }

            case "method": {
                assert(className);
                const method = interaction.data.options.getString("method", true);
                return methodRunner.call(this, interaction, className, method, version);
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
                    .addOption("version", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The version of Oceanic to get documentation for.")
                            .setRequired(true)
                            .setAutocomplete();
                    })
                    .addOption("class", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the class to get information about.")
                            .setRequired()
                            .setAutocomplete();
                    });
            })
            .addOption("event", ApplicationCommandOptionTypes.SUB_COMMAND, option => {
                option.setDescription("Get documentation for an event.")
                    .addOption("version", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The version of Oceanic to get documentation for.")
                            .setRequired(true)
                            .setAutocomplete();
                    })
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
                            .addOption("version", ApplicationCommandOptionTypes.STRING, subSubOption => {
                                subSubOption.setDescription("The version of Oceanic to get documentation for.")
                                    .setRequired(true)
                                    .setAutocomplete();
                            })
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
                            .addOption("version", ApplicationCommandOptionTypes.STRING, subSubOption => {
                                subSubOption.setDescription("The version of Oceanic to get documentation for.")
                                    .setRequired(true)
                                    .setAutocomplete();
                            })
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
                    .addOption("version", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The version of Oceanic to get documentation for.")
                            .setRequired(true)
                            .setAutocomplete();
                    })
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
                    .addOption("version", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The version of Oceanic to get documentation for.")
                            .setRequired(true)
                            .setAutocomplete();
                    })
                    .addOption("type", ApplicationCommandOptionTypes.STRING, subOption => {
                        subOption.setDescription("The name of the type to get information about.")
                            .setRequired()
                            .setAutocomplete();
                    });
            });
    }
}
