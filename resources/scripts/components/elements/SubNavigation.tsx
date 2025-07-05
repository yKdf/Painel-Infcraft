import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full rounded-xl bg-neutral-700 shadow overflow-x-auto`};
    max-width: 1200px;

    & > div {
        ${tw`flex items-center text-sm mx-auto px-2`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`flex items-center h-full no-underline text-neutral-300 px-4 py-4 cursor-pointer transition-all duration-150`};

            &:not(:first-of-type) {
                ${tw`ml-2`};
            }

            &:active,
            &:hover {
                ${tw`text-neutral-100 rounded-xl`};
            }

            &:active,
            &:hover,
            &.active {
                ${tw`text-neutral-100`};
                box-shadow: inset 0 -2px ${theme`colors.cyan.600`.toString()};
            }
        }
    }
`;

export default SubNavigation;
