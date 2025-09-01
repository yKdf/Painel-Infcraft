import React from 'react';
import { Button } from '@/components/elements/button/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faTh } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';

interface ViewToggleButtonProps {
    isGridView: boolean;
    onToggle: () => void;
}

const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({ isGridView, onToggle }) => {
    return (
        <Button
            onClick={onToggle}
            css={tw`flex items-center justify-center`}
            title={isGridView ? 'Alternar para visualização em lista' : 'Alternar para visualização em grid'}
        >
            <FontAwesomeIcon icon={isGridView ? faList : faTh} css={tw`mr-2`} />
            {isGridView ? 'Lista' : 'Grid'}
        </Button>
    );
};

export default ViewToggleButton;
