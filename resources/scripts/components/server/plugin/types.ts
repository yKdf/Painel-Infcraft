export enum Source {
    Spigot = 'spigot',
    Polymart = 'polymart',
    Modrinth = 'modrinth',
}

//Type definition for a plugin
export interface Plugin {
    id: number | string;
    name: string;
    premium: boolean;
    external: boolean;
    file: {
        externalUrl: string | undefined;
    };
    rating: {
        average: number;
    };
    icon: any;
    testedVersions: string[];
    tag: string;
    price: number;
    currency: string;
    version: string;
    creationTime: Date;
    lastUpdateTime: Date;
    source: Source;
    canDownload: boolean;
    versionId: number;
    currentVersionId: number | undefined;
    downloads: number;
}

//Type definition for a plugin's version
export interface Version {
    externalUrl?: string;
    name: string;
    downloads: number;
    id: number;
    description: string;
    downloadUrl: string | undefined;
    rating?: {
        count: number;
        average: number;
    };
}

/**
 * Default method to generate a clean filename that Pterodactyl can accept
 * @param name The name of the plugin
 * @returns a string that can be accepted by Pterodactyl for a filename
 */
export function pruneFileName(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9- ]/g, '')
        .split(' ')
        .join('');
}
