import { ApplicationCommandBuilder } from "@oceanicjs/builders";
import {
    ApplicationCommandTypes,
    type Client,
    type CommandInteraction,
    type CreateApplicationCommandOptions,
    type Permission,
    type PermissionName,
} from "oceanic.js";

export default abstract class Command {
    defaultMemberPermissions?: bigint | string | Permission | Array<PermissionName>;
    abstract description: string;
    descriptionLocalizations?: Record<string, string>;
    dmPermission?: boolean;
    abstract name: string;
    nameLocalizations?: Record<string, string>;
    abstract type: ApplicationCommandTypes;
    abstract run(this: Client, interaction: CommandInteraction): Promise<unknown>;
    setOptions?(command: ApplicationCommandBuilder): void;

    toJSON(): CreateApplicationCommandOptions {
        const builder = new ApplicationCommandBuilder(this.type, this.name)
            .setDescription(this.description);
        this.setOptions?.(builder);
        if (this.defaultMemberPermissions !== undefined) {
            builder.setDefaultMemberPermissions(this.defaultMemberPermissions);
        }
        if (this.descriptionLocalizations !== undefined) {
            builder.setDescriptionLocalizations(this.descriptionLocalizations);
        } if (this.dmPermission !== undefined) {
            builder.setDMPermission(this.dmPermission);
        }
        if (this.nameLocalizations !== undefined) {
            builder.setNameLocalizations(this.nameLocalizations);
        }
        return builder.toJSON();
    }
}

export class EmptyCommand extends Command {
    description = "This command is empty.";
    name = "empty";
    type = ApplicationCommandTypes.CHAT_INPUT;
    async run(): Promise<never> {
        throw new Error("This command is empty.");
    }
}
