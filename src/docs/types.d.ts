export interface Root {
    classes: Array<Class>;
    enums: Array<Enum>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    functions: Array<Function>;
    interfaces: Array<Interface>;
    references: Array<Reference>;
    typeAliases: Array<TypeAlias>;
    variables: Array<Variable>;
}

export interface Parameter {
    comment?: string;
    name: string;
    optional: boolean;
    text: string;
}

export interface Constructor {
    parameters: Array<Parameter>;
}

export interface Property {
    comment?: string;
    name: string;
    optional: boolean;
    readonly: boolean;
    static: boolean;
    text: string;
}

export interface Accessor {
    comment?: string;
    name: string;
    static: boolean;
    text: string;
}

export interface TypeParameter {
    default?: string;
    extends?: string;
    name: string;
}

export interface Method {
    comment?: string;
    name: string;
    overloads: Array<Overload>;
    static: boolean;
}

export interface Function {
    comment?: string;
    module: string;
    name: string;
    parameters: Array<Parameter>;
    typeParameters: Array<TypeParameter>;
}

export interface Class {
    abstract: boolean;
    accessors: Array<Accessor>;
    comment?: string;
    constructor: Constructor;
    events: Array<Event>;
    extends?: string;
    methods: Array<Method>;
    module: string;
    name: string;
    properties: Array<Property>;
    typeParameters: Array<TypeParameter>;
}

export interface Event {
    comment?: string;
    interface: string;
    module: string;
    name: string;
    overloads: Array<Overload>;
}

export interface Interface {
    comment?: string;
    extends?: string;
    module: string;
    name: string;
    properties: Array<Property>;
}

export interface EnumMember {
    comment?: string;
    name: string;
    text: string;
}

export interface Enum {
    comment?: string;
    members: Array<EnumMember>;
    module: string;
    name: string;
}

export interface TypeAlias {
    comment?: string;
    module: string;
    name: string;
    text: string;
}

export interface Variable {
    comment?: string;
    const: boolean;
    module: string;
    name: string;
    text: string;
}

export interface Reference {
    comment?: string;
    name: string;
    text: string;
}

export interface Overload {
    parameters: Array<Parameter>;
    return?: string;
    typeParameters: Array<TypeParameter>;
}
