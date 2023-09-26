import { Config, getClient } from "./util.js";
import { EmbedBuilder } from "@oceanicjs/builders";

export async function handleError(title: string, err: Error) {
    await getClient().rest.webhooks.execute(Config.logWebhook.id, Config.logWebhook.token, {
        embeds: new EmbedBuilder()
            .setTitle(`Error: ${title}`)
            .setColor(0xDC143C)
            .setDescription(`\`\`\`js\n${err.stack ?? `${err.name}: ${err.message}`}\`\`\``.slice(0, 4096))
            .toJSON(true)
    });
}
