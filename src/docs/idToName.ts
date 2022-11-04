const nameMap = new Map<number, string>();

export function getMap() {
    return nameMap;
}

export function getName(id: number) {
    if (!nameMap.has(id)) {
        console.log(`Missing name for ${id}`);
    }
    return nameMap.get(id) ?? `default[${id}]`;
}

export function setName(id: number, name: string) {
    nameMap.set(id, name);
}

export function resetNames() {
    nameMap.clear();
}
