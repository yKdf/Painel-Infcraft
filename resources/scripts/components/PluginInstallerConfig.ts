import tw, { TwStyle } from 'twin.macro';

interface DataType {
    style: {
        [style: string]: {
            buttonUninstall?: TwStyle;
            buttonUpdate?: TwStyle;
            buttonInstall?: TwStyle;
            openExternal?: TwStyle;
            versionsButton?: TwStyle;
            entryStyle?: TwStyle;
            plugins?: TwStyle;
            rounding?: string;
            primaryColor?: string;
            secondaryColor?: string;
            inputBorder?: string;
        };
    };
    config: {
        amountPerPage: number;
        polymartReferral: string;
    };
}

/**
 * Find tailwind styles here: https://tailwindcss.com/
 * If you have any questions ask in the support Discord
 */
const data: DataType = {
    style: {
        default: {
            buttonUninstall: tw`text-lg bg-red-700 hover:bg-red-800 text-white rounded-lg p-1 mx-auto w-full border-2 border-red-500`,
            buttonUpdate: tw`text-lg bg-yellow-700 hover:bg-yellow-800 text-white rounded-lg p-1 mx-auto w-full border-2 border-yellow-500`,
            buttonInstall: tw`text-lg bg-green-500 hover:bg-green-400 text-white rounded-lg p-1 mx-auto w-full border-2 border-green-600`,
            openExternal: tw`w-10 h-10 ml-2 bg-indigo-600 hover:bg-indigo-700 border-2 border-indigo-500 rounded-lg`,
            versionsButton: tw`rounded-lg p-1 mx-auto w-full text-lg bg-gray-600 hover:bg-indigo-500 text-white mt-4`,
            entryStyle: tw`rounded-lg hover:ring-2 ring-gray-500 bg-neutral-700`,
            plugins: tw`grid lg:grid-rows-4 lg:grid-cols-4 mt-4 p-1 gap-4`,
            rounding: 'rounded-lg',
            primaryColor: 'bg-gray-800',
            secondaryColor: 'bg-gray-700',
            inputBorder: '0',
        },
        enigma: {
            // Also change amountPerPage to 9 for this to work properly
            buttonUninstall: tw`text-lg bg-red-700 hover:bg-red-800 text-white rounded-lg p-1 mx-auto w-full border-2 border-red-500`,
            buttonUpdate: tw`text-lg bg-yellow-700 hover:bg-yellow-800 text-white rounded-lg p-1 mx-auto w-full border-2 border-yellow-500`,
            buttonInstall: tw`text-lg bg-green-500 hover:bg-green-400 text-white rounded-lg p-1 mx-auto w-full border-2 border-green-600`,
            openExternal: tw`w-10 h-10 ml-2 bg-indigo-600 hover:bg-indigo-700 border-2 border-indigo-500 rounded-lg`,
            versionsButton: tw`rounded-lg p-1 mx-auto w-full text-lg bg-gray-600 hover:bg-indigo-500 text-white mt-4`,
            entryStyle: tw`rounded-lg hover:ring-2 ring-gray-500 bg-neutral-700`,
            plugins: tw`grid lg:grid-rows-3 lg:grid-cols-3 mt-4 mx-10 gap-4`,
            rounding: 'rounded-lg',
            primaryColor: '#0D181E',
            secondaryColor: '#132537',
            inputBorder: '0',
        },
        dark: {
            buttonUninstall: tw`text-lg bg-red-700 hover:bg-red-800 text-white rounded-lg p-1 mx-auto w-full border-2 border-red-500`,
            buttonUpdate: tw`text-lg bg-yellow-700 hover:bg-yellow-800 text-white rounded-lg p-1 mx-auto w-full border-2 border-yellow-500`,
            buttonInstall: tw`text-lg bg-green-500 hover:bg-green-400 text-white rounded-lg p-1 mx-auto w-full border-2 border-green-600`,
            openExternal: tw`w-10 h-10 ml-2 bg-indigo-600 hover:bg-indigo-700 border-2 border-indigo-500 rounded-lg`,
            versionsButton: tw`rounded-lg p-1 mx-auto w-full text-lg bg-gray-600 hover:bg-indigo-500 text-white mt-4`,
            entryStyle: tw`rounded-lg hover:ring-2 ring-gray-500`,
            plugins: tw`grid lg:grid-rows-4 lg:grid-cols-4 mt-4 mx-10 gap-4`,
            rounding: 'rounded-full',
            primaryColor: 'bg-gray-800',
            secondaryColor: 'bg-gray-700',
            inputBorder: '2',
        },
    },
    config: {
        amountPerPage: 16,
        polymartReferral: '13204',
    },
};

const style = data.style['default'];
const config = data.config;

export { style, config };
