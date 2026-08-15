const nameMap = new Map<number, string>();

export function getMap(): Map<number, string> {
    return nameMap;
}

export function getName(id: number): string {
    if (!nameMap.has(id)) {
        console.log(`Missing name for ${id}`);
        console.debug(new TypeError(`Missing name for ${id}`).stack);
    }
    return nameMap.get(id) ?? `default[${id}]`;
}

export function setName(id: number, name: string): void {
    nameMap.set(id, name);
}

export function resetNames(): void {
    nameMap.clear();
}
