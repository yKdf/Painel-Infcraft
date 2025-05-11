import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Label = styled.label<{ isLight?: boolean }>`
    ${tw`block text-xs uppercase text-white mb-1 sm:mb-2`};
    ${(props) => props.isLight && tw`text-yellow-100`};
`;

export default Label;
