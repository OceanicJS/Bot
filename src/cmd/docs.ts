import {
    checkVersion,
    defaultVersion,
    docsURL,
    getVersion,
    linkType,
    truncateChoices,
    versions
} from "../util";
import {
    AutocompleteInteraction,
    Client,
    CommandInteraction,
    EmbedField,
    InteractionOptionsString,
    MessageFlags
} from "oceanic.js";
import FuzzySearch from "fuzzy-search";
import assert from "node:assert";

export async function handleDocsCommand(this: Client, interaction: CommandInteraction) {
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
export async function handleVersionedDocsCommand(this: Client, interaction: CommandInteraction) {
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

export function handleIssue(json: "invalid" | `invalid_${"class" | "event" | "class_property" | "interface_property" | "method" | "interface" | "type"}` | `no_${"events" | "properties_class" | "properties_interface" | "methods"}` | "loading", interaction: CommandInteraction | AutocompleteInteraction, ver: string, autocomplete: boolean, primaryName: string | null, secondaryName: string | null): void {
    switch (json) {
        case "invalid": {
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `Invalid Version "${ver}"`,
                value: "version_invalid"
            }]) : interaction.createMessage({
                content: `Invalid Version "${ver}"`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "invalid_class": {
            console.debug("[%s] Invalid Class (%s), raw: %s", new Date().toISOString(), primaryName || "Unknown", JSON.stringify(interaction.data));
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `Invalid class "${primaryName!}"`,
                value: "class_invalid"
            }]) : interaction.createMessage({
                content: `The class "${primaryName!}" is invalid.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "invalid_event": {
            console.debug("[%s] Invalid Event (%s#event:%s), raw: %s", new Date().toISOString(), primaryName || "Unknown", secondaryName || "Unknown", JSON.stringify(interaction.data));
            return void (interaction as CommandInteraction).createMessage({
                content: `The event "${primaryName || "Unknown"}#event:${secondaryName || "Unknown"}" is invalid.`,
                flags:   MessageFlags.EPHEMERAL
            });
        }
        case "invalid_class_property": {
            console.debug("[%s] Invalid Class Property (%s#%s), raw: %s", new Date().toISOString(), primaryName || "Unknown", secondaryName || "Unknown", JSON.stringify(interaction.data));
            return void (interaction as CommandInteraction).createMessage({
                content: `The property "${primaryName || "Unknown"}#${secondaryName || "Unknown"}" is invalid."`,
                flags:   MessageFlags.EPHEMERAL
            });
        }
        case "invalid_interface_property": {
            console.debug("[%s] Invalid Interface Property (%s#%s), raw: %s", new Date().toISOString(), primaryName || "Unknown", secondaryName || "Unknown", JSON.stringify(interaction.data));
            return void (interaction as CommandInteraction).createMessage({
                content: `The property "${primaryName || "Unknown"}#${secondaryName || "Unknown"}" is invalid."`,
                flags:   MessageFlags.EPHEMERAL
            });
        }
        case "invalid_method": {
            console.debug("[%s] Invalid Method (%s#%s()), raw: %s", new Date().toISOString(), primaryName || "Unknown", secondaryName || "Unknown", JSON.stringify(interaction.data));
            return void (interaction as CommandInteraction).createMessage({
                content: `The method "${primaryName || "Unknown"}#${secondaryName || "Unknown"}()" is invalid.`,
                flags:   MessageFlags.EPHEMERAL
            });
        }
        case "invalid_interface": {
            console.debug("[%s] Invalid Interface (%s), raw: %s", new Date().toISOString(), primaryName || "Unknown", JSON.stringify(interaction.data));
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `Invalid interface "${primaryName!}"`,
                value: "interface_invalid"
            }]) : interaction.createMessage({
                content: `The interface "${primaryName!}" is invalid.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "invalid_type": {
            console.debug("[%s] Invalid Type (%s), raw: %s", new Date().toISOString(), primaryName || "Unknown", JSON.stringify(interaction.data));
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `Invalid type "${primaryName!}"`,
                value: "type_invalid"
            }]) : interaction.createMessage({
                content: `The type "${primaryName!}" is invalid.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "no_events": {
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `The class "${primaryName!}" has no events.`,
                value: "no_events"
            }]) : interaction.createMessage({
                content: `The class "${primaryName!}" has no events.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "no_properties_class": {
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `The class "${primaryName!}" has no properties.`,
                value: "no_events"
            }]) : interaction.createMessage({
                content: `The class "${primaryName!}" has no properties.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "no_properties_interface": {
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `The interface "${primaryName!}" has no properties.`,
                value: "no_events"
            }]) : interaction.createMessage({
                content: `The interface "${primaryName!}" has no properties.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "no_methods": {
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `The class "${primaryName!}" has no methods.`,
                value: "no_events"
            }]) : interaction.createMessage({
                content: `The class "${primaryName!}" has no methods.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
        case "loading": {
            return void (interaction instanceof AutocompleteInteraction ? interaction.result([{
                name:  `Version "${ver}" is still loading, please be patient.`,
                value: "loading"
            }]) : interaction.createMessage({
                content: `Version "${ver}" is still loading, please be patient.`,
                flags:   MessageFlags.EPHEMERAL
            }));
        }
    }
}

export async function handleAutocomplete(this: Client, interaction: AutocompleteInteraction, version: string) {
    const check = await checkVersion(version);
    if (!check) {
        return handleIssue("loading", interaction, version, true, null, null);
    }
    const [type] = interaction.data.options.getSubCommand<["class" | "event" | "property" | "method" | "interface" | "type"]>(true);
    const name = interaction.data.options.getString("class") || interaction.data.options.getString("interface");
    const majorType = interaction.data.options.getStringOption("class") ? "class" as const : (interaction.data.options.getStringOption("interface") ? "interface" as const : undefined as never);
    const root = await getVersion(version);
    if (root === null) {
        return handleIssue("invalid", interaction, version, true, null, null);
    }
    const classNames = root.classes.map(c => c.name);
    let searchWith = [...classNames];
    switch (type) {
        case "event": {
            searchWith = searchWith.filter(s => root.classes.find(c => c.name === s)!.events.length !== 0);
            break;
        }
        case "property": {
            searchWith = searchWith.filter(s => root.classes.find(c => c.name === s)!.properties.length !== 0);
            break;
        }
        case "method": {
            searchWith = searchWith.filter(s => root.classes.find(c => c.name === s)!.methods.length !== 0);
            break;
        }
        case "type": {
            searchWith = [...root.interfaces.map(t => t.name), ...root.typeAliases.map(e => e.name)];
            break;
        }
        case "interface": {
            searchWith = root.interfaces.map(t => t.name);
            break;
        }
    }

    const focused = interaction.data.options.getFocused<InteractionOptionsString>(true);

    switch (focused.name) {
        case "version": {
            const search = new FuzzySearch(versions, undefined, {
                sort: true
            });

            return interaction.result(truncateChoices(search.search(focused.value).map(val => ({ name: val, value: val }))));
        }
        case "interface": {
            const search = new FuzzySearch(root.interfaces.map(t => t.name), undefined, {
                sort: true
            });

            return interaction.result(truncateChoices(search.search(focused.value).map(val => ({ name: val, value: val }))));
        }
        case "type": {
            const search = new FuzzySearch([...root.interfaces.map(t => t.name), ...root.typeAliases.map(e => e.name)], undefined, {
                sort: true
            });

            return interaction.result(truncateChoices(search.search(focused.value).map(val => ({ name: val, value: val }))));
        }

        case "class": {
            const search = new FuzzySearch(searchWith, undefined, {
                sort: true
            });

            return interaction.result(truncateChoices(search.search(focused.value).map(s => ({ name: s, value: s }))));
        }

        case "event": {
            const clazz = root.classes.find(c => c.name === name)!;
            if (clazz.events.length === 0) {
                return handleIssue("no_events", interaction, version, true, name!, null);
            }
            const search = new FuzzySearch(clazz.events, ["name"], {
                sort: true
            });

            return interaction.result(truncateChoices(search.search(focused.value).map(ev => ({
                name:  `${ev.name}(${ev.overloads[0].parameters.map(p => `${p.text.includes("null") ? "?" : ""}${p.name}${p.optional ? "?" : ""}`).join(", ")})`,
                value: ev.name
            }))));
        }

        case "property": {
            const clazz = root.classes.find(c => c.name === name);
            const iface = root.interfaces.find(i => i.name === name);
            if ((majorType === "class" ? clazz : iface)!.properties.length === 0) {
                return handleIssue(`no_properties_${majorType === "class" ? "class" : "interface"}`, interaction, version, true, name!, null);
            }
            const search = new FuzzySearch(majorType === "class" ? clazz!.properties : iface!.properties, ["name"], {
                sort: true
            });

            return interaction.result(truncateChoices(search.search(focused.value).map(ev => ({
                name:  ev.name,
                value: ev.name
            }))));
        }

        case "method": {
            const clazz = root.classes.find(c => c.name === name)!;
            if (clazz.methods.length === 0) {
                return handleIssue("no_methods", interaction, version, true, name!, null);
            }
            const search = new FuzzySearch(clazz.methods, ["name"], {
                sort: true
            });

            return interaction.result(truncateChoices(search.search(focused.value).map(ev => ({
                name:  `${ev.name}(${ev.overloads[0].parameters.map(p => `${p.text.includes("null") ? "?" : ""}${p.name}${p.optional ? "?" : ""}`).join(", ")})`,
                value: ev.name
            }))));
        }
    }
}

async function classRunner(this: Client, interaction: CommandInteraction, className: string, version: string) {
    const data = await getVersion(version);
    if (data === null) {
        return void handleIssue("invalid", interaction, version, false, className, null);
    }

    const clazz = data.classes.find(c => c.name.toLowerCase() === className.toLowerCase());
    if (clazz === undefined) {
        return void handleIssue("invalid_class", interaction, version, false, className, null);
    }

    const fields: Array<EmbedField> = [
        {
            name:  "Kind",
            value: "Class"
        }
    ];

    if (clazz.events.length !== 0) {
        const events = clazz.events.slice(0, 10).filter(event => event.name.length < 29).map(event => `[${event.name}](${docsURL(version, "interface", event.module, event.interface, event.name)})`);
        let text = "";
        for (const event of events) {
            if (text.length + event.length > 1024) {
                break;
            }
            text += (text === "" ? "" : "\n") + event;
        }
        fields.push({
            name:   `Event${clazz.events.length === 1 ? "" : "s"} (${clazz.events.length})`,
            value:  text,
            inline: true
        });
    }

    if (clazz.properties.length !== 0) {
        const props = clazz.properties.slice(0, 10).filter(property => property.name.length < 29).map(property => `[${property.text.includes("null") ? "?" : ""}${property.name}${property.optional ? "?" : ""}](${docsURL(version, "class", clazz.module, className, property.name)})`);
        let text = "";
        for (const prop of props) {
            if (text.length + prop.length > 1020) {
                break;
            }
            text += (text === "" ? "" : "\n") + prop;
        }
        fields.push({
            name:   `Propert${clazz.properties.length === 1 ? "y" : "ies"} (${clazz.properties.length})`,
            value:  text,
            inline: true
        });
    }

    if (clazz.methods.length !== 0) {
        const methods = clazz.methods.slice(0, 10).filter(method => method.name.length < 29).map(method => `[${method.name}](${docsURL(version, "class", clazz.module, className, method.name)})`);
        let text = "";
        for (const method of methods) {
            if (text.length + method.length > 1020) {
                break;
            }
            text += (text === "" ? "" : "\n") + method;
        }
        fields.push({
            name:   `Method${methods.length === 1 ? "" : "s"} (${clazz.methods.length})`,
            value:  text,
            inline: true
        });
    }

    if (clazz.typeParameters.length !== 0) {
        fields.push({
            name:   "Type Parameters",
            value:  (await Promise.all(clazz.typeParameters.map(async type => `\`${type.name}\`${type.extends ? ` extends ${await linkType(version, type.extends)}` : ""}${type.default ? ` = ${await linkType(version, type.default)}` : ""}`))).join("\n"),
            inline: true
        });
    }

    if (clazz.constructor.parameters.length !== 0) {
        const params = clazz.constructor.parameters.map(p => `\`${p.text.includes("null") ? "?" : ""}${p.name}${p.optional ? "?" : ""}\``);
        let text = "";
        for (const param of params) {
            if (text.length + param.length > 1020) {
                break;
            }
            text += (text === "" ? "" : "\n") + param;
        }
        fields.push({
            name:  "Constructor",
            value: [
                `\`new ${className}(${clazz.constructor.parameters.map(p => p.name).join(", ")})\``,
                "",
                ...(await Promise.all(clazz.constructor.parameters.map(async p => `\`${p.text.includes("null") ? "?" : ""}${p.name}${p.optional ? "?" : ""}\` - ${await linkType(version, p.text)}\n${p.comment || ""}`)))
            ].join("\n"),
            inline: false
        });
    }

    return interaction.createMessage({
        embeds: [
            {
                url:         docsURL(version, "class", clazz.module, className),
                title:       `${clazz.name} @ ${version}`,
                description: clazz.comment,
                color:       0x2A5099,
                fields
            }
        ]
    });
}

async function eventRunner(this: Client, interaction: CommandInteraction, className: string, eventName: string, version: string) {
    const data = await getVersion(version);
    if (data === null) {
        return void handleIssue("invalid", interaction, version, false, className, null);
    }

    const clazz = data.classes.find(c => c.name.toLowerCase() === className.toLowerCase());
    if (clazz === undefined) {
        return void handleIssue("invalid_class", interaction, version, false, className, null);
    }
    const event = clazz.events.find(e => e.name.toLowerCase() === eventName.toLowerCase());
    if (event === undefined) {
        return void handleIssue("invalid_event", interaction, version, false, className, eventName);
    }

    return interaction.createMessage({
        embeds: [
            {
                title:       `${className}.on("${event.name}") @ ${version}`,
                url:         docsURL(version, "interface", event.module, event.interface, event.name),
                description: event.comment ?? "[NONE]",
                fields:      [
                    {
                        name:  "Kind",
                        value: "Event"
                    },
                    {
                        name:  "Parameters",
                        value: (await Promise.all(event.overloads[0].parameters.map(async p => `\`${p.text.includes("null") ? "?" : ""}${p.name}${p.optional ? "?" : ""}\` - ${await linkType(version, p.text)}\n${p.comment || ""}`))).join("\n") || "NONE"
                    }
                ],
                color: 0x2A5099
            }
        ]
    });
}

async function classPropertyRunner(this: Client, interaction: CommandInteraction, className: string, propertyName: string, version: string) {
    const data = await getVersion(version);
    if (data === null) {
        return void handleIssue("invalid", interaction, version, false, className, null);
    }

    const clazz = data.classes.find(c => c.name.toLowerCase() === className.toLowerCase());
    if (clazz === undefined) {
        return void handleIssue("invalid_class", interaction, version, false, className, null);
    }
    const property = clazz.properties.find(p => p.name.toLowerCase() === propertyName.toLowerCase());
    if (property === undefined) {
        return void handleIssue("invalid_class_property", interaction, version, false, className, propertyName);
    }

    return interaction.createMessage({
        embeds: [
            {
                title:       `${className} -> ${property.name} @ ${version}`,
                url:         docsURL(version, "class", clazz.module, className, property.name),
                description: property.comment ?? "[NONE]",
                fields:      [
                    {
                        name:  "Kind",
                        value: "Class Property"
                    },
                    {
                        name:  "Type",
                        value: await linkType(version, property.text)
                    }
                ],
                color: 0x2A5099
            }
        ]
    });
}

async function interfacePropertyRunner(this: Client, interaction: CommandInteraction, interfaceName: string, propertyName: string, version: string) {
    const data = await getVersion(version);
    if (data === null) {
        return void handleIssue("invalid", interaction, version, false, interfaceName, null);
    }

    const iface = data.interfaces.find(c => c.name.toLowerCase() === interfaceName.toLowerCase());
    if (iface === undefined) {
        return void handleIssue("invalid_interface", interaction, version, false, interfaceName, null);
    }
    const property = iface.properties.find(p => p.name.toLowerCase() === propertyName.toLowerCase());
    if (property === undefined) {
        return void handleIssue("invalid_interface_property", interaction, version, false, interfaceName, propertyName);
    }

    return interaction.createMessage({
        embeds: [
            {
                title:       `${interfaceName} -> ${property.name} @ ${version}`,
                url:         docsURL(version, "interface", iface.module, interfaceName, property.name),
                description: property.comment ?? "[NONE]",
                fields:      [
                    {
                        name:  "Kind",
                        value: "Interface Property"
                    },
                    {
                        name:  "Type",
                        value: await linkType(version, property.text)
                    }
                ],
                color: 0x2A5099
            }
        ]
    });
}

async function methodRunner(this: Client, interaction: CommandInteraction, className: string, eventName: string, version: string) {
    const data = await getVersion(version);
    if (data === null) {
        return void handleIssue("invalid", interaction, version, false, className, null);
    }

    const clazz = data.classes.find(c => c.name.toLowerCase() === className.toLowerCase());
    if (clazz === undefined) {
        return void handleIssue("invalid_class", interaction, version, false, className, null);
    }
    const method = clazz.methods.find(e => e.name.toLowerCase() === eventName.toLowerCase());
    if (method === undefined) {
        return void handleIssue("invalid_method", interaction, version, false, className, eventName);
    }

    return interaction.createMessage({
        embeds: [
            {
                title:       `${className}#${method.name}() @ ${version}`,
                url:         docsURL(version, "class", clazz.module, className, method.name),
                description: method.comment ?? "[NONE]",
                fields:      [
                    {
                        name:  "Kind",
                        value: "Event"
                    },
                    {
                        name:  "Parameters",
                        value: (await Promise.all(method.overloads[0].parameters.map(async p => `\`${p.text.includes("null") ? "?" : ""}${p.name}${p.optional ? "?" : ""}\` - ${await linkType(version, p.text)}\n${p.comment || ""}`))).join("\n") || "NONE"
                    },
                    ...(method.overloads[0].typeParameters.length !== 0 ? [
                        {
                            name:  "Type Parameters",
                            value: (await Promise.all(method.overloads[0].typeParameters.map(async type => `\`${type.name}\`${type.extends ? ` extends ${await linkType(version, type.extends)}` : ""}${type.default ? ` = ${await linkType(version, type.default)}` : ""}`))).join("\n")
                        }
                    ] : []),
                    {
                        name:  "Return",
                        value: await linkType(version, method.overloads[0].return!)
                    }
                ],
                color: 0x2A5099
            }
        ]
    });
}

async function typeRunner(this: Client, interaction: CommandInteraction, name: string, version: string) {
    const data = await getVersion(version);
    if (data === null) {
        return void handleIssue("invalid", interaction, version, false, name, null);
    }

    const type = data.typeAliases.find(c => c.name.toLowerCase() === name.toLowerCase());
    const iface = data.interfaces.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (type === undefined && iface === undefined) {
        return void handleIssue("invalid_type", interaction, version, false, name, null);
    }

    const fields: Array<EmbedField> = [];
    if (type) {
        fields.push({
            name:  "Kind",
            value: "Type Alias"
        },
        {
            name:  "Type",
            value: await linkType(version, type.text)
        });
    } else if (iface) {
        fields.push({
            name:  "Kind",
            value: "Interface"
        });
        if (iface.properties.length !== 0) {
            const props = iface.properties.slice(0, 10).filter(property => property.name.length < 29).map(property => `[${property.text.includes("null") ? "?" : ""}${property.name}${property.optional ? "?" : ""}](${docsURL(version, "class", iface.module, name, property.name)})`);
            let text = "";
            for (const prop of props) {
                if (text.length + prop.length > 1020) {
                    break;
                }
                text += (text === "" ? "" : "\n") + prop;
            }
            fields.push({
                name:   `Propert${iface.properties.length === 1 ? "y" : "ies"} (${iface.properties.length})`,
                value:  text,
                inline: true
            });
        }
    }

    const use = (type ?? iface)!;

    return interaction.createMessage({
        embeds: [
            {
                url:         docsURL(version, type ? "typeAlias" : "interface", use.module, name),
                title:       `${use.name} @ ${version}`,
                description: use.comment,
                color:       0x2A5099,
                fields
            }
        ]
    });
}
