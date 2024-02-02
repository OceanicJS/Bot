type QueueFunction = () => Promise<unknown>;
export default class GenerationQueue {
    private static current: string | null = null;
    private static queue: Array<{ func: QueueFunction; label: string; }> = [];
    private static running = false;

    private static async run(): Promise<void> {
        if (this.queue.length !== 0) {
            const { label, func } = this.queue.shift()!;
            try {
                this.running = true;
                this.current = label;
                await func();
            } catch (error) {
                console.error(`Error executing "${label}":`, error);
            } finally {
                this.running = false;
                this.current = null;
                void this.run();
            }
        }
    }

    static add(label: string, func: QueueFunction) {
        this.queue.push({ label, func });
        if (!this.running) {
            void this.run();
        }
    }

    static getCurrent(): string | null {
        return this.current;
    }

    static has(label: string) {
        return this.queue.some(task => task.label === label);
    }
}
