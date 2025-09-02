import React, { useCallback, useEffect, useState } from 'react';
import CodeMirror from 'codemirror';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import modes from '@/modes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './CodemirrorEditor.css';

require('codemirror/lib/codemirror.css');
require('codemirror/theme/ayu-mirage.css');
require('codemirror/addon/edit/closebrackets');
require('codemirror/addon/edit/closetag');
require('codemirror/addon/edit/matchbrackets');
require('codemirror/addon/edit/matchtags');
require('codemirror/addon/edit/trailingspace');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter.css');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/comment-fold');
require('codemirror/addon/fold/indent-fold');
require('codemirror/addon/fold/markdown-fold');
require('codemirror/addon/fold/xml-fold');
require('codemirror/addon/hint/css-hint');
require('codemirror/addon/hint/html-hint');
require('codemirror/addon/hint/javascript-hint');
require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/sql-hint');
require('codemirror/addon/hint/xml-hint');
require('codemirror/addon/mode/simple');
require('codemirror/addon/dialog/dialog.css');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/scroll/annotatescrollbar');
require('codemirror/addon/scroll/scrollpastend');
require('codemirror/addon/scroll/simplescrollbars.css');
require('codemirror/addon/scroll/simplescrollbars');
require('codemirror/addon/search/jump-to-line');
require('codemirror/addon/search/match-highlighter');
require('codemirror/addon/search/matchesonscrollbar.css');
require('codemirror/addon/search/matchesonscrollbar');
require('codemirror/addon/search/search');
require('codemirror/addon/search/searchcursor');

require('codemirror/mode/brainfuck/brainfuck');
require('codemirror/mode/clike/clike');
require('codemirror/mode/css/css');
require('codemirror/mode/dart/dart');
require('codemirror/mode/diff/diff');
require('codemirror/mode/dockerfile/dockerfile');
require('codemirror/mode/erlang/erlang');
require('codemirror/mode/gfm/gfm');
require('codemirror/mode/go/go');
require('codemirror/mode/handlebars/handlebars');
require('codemirror/mode/htmlembedded/htmlembedded');
require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/mode/http/http');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/jsx/jsx');
require('codemirror/mode/julia/julia');
require('codemirror/mode/lua/lua');
require('codemirror/mode/markdown/markdown');
require('codemirror/mode/nginx/nginx');
require('codemirror/mode/perl/perl');
require('codemirror/mode/php/php');
require('codemirror/mode/properties/properties');
require('codemirror/mode/protobuf/protobuf');
require('codemirror/mode/pug/pug');
require('codemirror/mode/python/python');
require('codemirror/mode/rpm/rpm');
require('codemirror/mode/ruby/ruby');
require('codemirror/mode/rust/rust');
require('codemirror/mode/sass/sass');
require('codemirror/mode/shell/shell');
require('codemirror/mode/smarty/smarty');
require('codemirror/mode/sql/sql');
require('codemirror/mode/swift/swift');
require('codemirror/mode/toml/toml');
require('codemirror/mode/twig/twig');
require('codemirror/mode/vue/vue');
require('codemirror/mode/xml/xml');
require('codemirror/mode/yaml/yaml');

const SearchBar = styled.div`
    ${tw`flex-1 flex items-center bg-gray-800 border-b border-gray-600 px-3 py-2 text-sm`};
    height: 42px; // Fixed height for search bar

    input {
        ${tw`bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 mr-2 flex-1 focus:outline-none focus:border-blue-500`};
        font-size: 12px;
    }

    button {
        ${tw`bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded mr-1 transition-colors duration-150`};
        font-size: 11px;

        &:disabled {
            ${tw`opacity-50 cursor-not-allowed`};
        }
    }

    .search-info {
        ${tw`text-gray-400 text-xs mr-2`};
    }
`;

const EditorContainer = styled.div`
    min-height: 16rem;
    height: calc(100vh - 20rem);
    ${tw`relative flex flex-col`}; // Added flex column layout

    .editor-wrapper {
        ${tw`rounded flex-1`};
        height: calc(100% - 42px);
    }

    .CodeMirror {
        ${tw`h-full`};
        font-size: 12px;
        line-height: 1.375rem;
    }

    .CodeMirror-linenumber {
        padding: 1px 12px 0 12px !important;
    }

    .CodeMirror-foldmarker {
        color: #cbccc6;
        text-shadow: none;
        margin-left: 0.25rem;
        margin-right: 0.25rem;
    }

    .CodeMirror-search-match {
        background: rgba(255, 255, 0, 0.4);
    }

    .CodeMirror-search-match-selected {
        background: rgba(255, 165, 0, 0.6);
    }
`;

export interface Props {
    style?: React.CSSProperties;
    initialContent?: string;
    mode: string;
    filename?: string;
    onModeChanged: (mode: string) => void;
    fetchContent: (callback: () => Promise<string>) => void;
    onContentSaved: () => void;
}

const findModeByFilename = (filename: string) => {
    for (let i = 0; i < modes.length; i++) {
        const info = modes[i];

        if (info.file && info.file.test(filename)) {
            return info;
        }
    }

    const dot = filename.lastIndexOf('.');
    const ext = dot > -1 && filename.substring(dot + 1, filename.length);

    if (ext) {
        for (let i = 0; i < modes.length; i++) {
            const info = modes[i];
            if (info.ext) {
                for (let j = 0; j < info.ext.length; j++) {
                    if (info.ext[j] === ext) {
                        return info;
                    }
                }
            }
        }
    }

    return undefined;
};

export default ({ style, initialContent, filename, mode, fetchContent, onContentSaved, onModeChanged }: Props) => {
    const [editor, setEditor] = useState<CodeMirror.Editor>();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentMatch, setCurrentMatch] = useState(0);
    const [totalMatches, setTotalMatches] = useState(0);

    const ref = useCallback((node) => {
        if (!node) return;

        const e = CodeMirror.fromTextArea(node, {
            mode: 'text/plain',
            theme: 'ayu-mirage',
            indentUnit: 4,
            smartIndent: true,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            lineNumbers: true,
            foldGutter: true,
            fixedGutter: true,
            scrollbarStyle: 'overlay',
            coverGutterNextToScrollbar: false,
            readOnly: false,
            showCursorWhenSelecting: false,
            autofocus: false,
            spellcheck: true,
            autocorrect: false,
            autocapitalize: false,
            lint: false,
            // @ts-expect-error this property is actually used, the d.ts file for CodeMirror is incorrect.
            autoCloseBrackets: true,
            matchBrackets: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        });

        setEditor(e);
    }, []);

    useEffect(() => {
        if (filename === undefined) {
            return;
        }

        onModeChanged(findModeByFilename(filename)?.mime || 'text/plain');
    }, [filename]);

    useEffect(() => {
        editor && editor.setOption('mode', mode);
    }, [editor, mode]);

    useEffect(() => {
        editor && editor.setValue(initialContent || '');
    }, [editor, initialContent]);

    const performSearch = useCallback(
        (query: string, direction: 'next' | 'prev' = 'next') => {
            if (!editor || !query) {
                setCurrentMatch(0);
                setTotalMatches(0);
                editor?.getAllMarks().forEach((mark) => mark.clear());
                return;
            }

            // Clear previous marks
            editor.getAllMarks().forEach((mark) => mark.clear());

            // Use CodeMirror's search functionality
            const doc = editor.getDoc();
            const content = doc.getValue();
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches: any[] = [];
            let match;

            // Find all matches
            while ((match = regex.exec(content)) !== null) {
                const from = doc.posFromIndex(match.index);
                const to = doc.posFromIndex(match.index + match[0].length);
                matches.push({ from, to });
            }

            setTotalMatches(matches.length);

            if (matches.length === 0) {
                setCurrentMatch(0);
                return;
            }

            // Mark all matches
            matches.forEach((match) => {
                editor.markText(match.from, match.to, {
                    className: 'CodeMirror-search-match',
                });
            });

            // Find current match based on cursor position
            const currentPos = editor.getCursor();
            let matchIndex = 0;

            if (direction === 'next') {
                matchIndex = matches.findIndex((match) => CodeMirror.cmpPos(match.from, currentPos) > 0);
                if (matchIndex === -1) matchIndex = 0;
            } else {
                matchIndex = matches.findIndex((match) => CodeMirror.cmpPos(match.from, currentPos) >= 0) - 1;
                if (matchIndex < 0) matchIndex = matches.length - 1;
            }

            setCurrentMatch(matchIndex + 1);

            // Highlight current match
            if (matches[matchIndex]) {
                editor.markText(matches[matchIndex].from, matches[matchIndex].to, {
                    className: 'CodeMirror-search-match-selected',
                });
                editor.scrollIntoView(matches[matchIndex].from);
                editor.setSelection(matches[matchIndex].from, matches[matchIndex].to);
            }
        },
        [editor]
    );

    const findNext = useCallback(() => {
        if (!searchQuery) return;
        performSearch(searchQuery, 'next');
    }, [searchQuery, performSearch]);

    const findPrevious = useCallback(() => {
        if (!searchQuery) return;
        performSearch(searchQuery, 'prev');
    }, [searchQuery, performSearch]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setCurrentMatch(0);
        setTotalMatches(0);
        if (editor) {
            editor.getAllMarks().forEach((mark) => mark.clear());
        }
    }, [editor]);

    useEffect(() => {
        if (searchQuery) {
            performSearch(searchQuery);
        } else {
            clearSearch();
        }
    }, [searchQuery, performSearch, clearSearch]);

    useEffect(() => {
        if (!editor) {
            fetchContent(() => Promise.reject(new Error('nenhuma sessão do editor foi configurada')));
            return;
        }

        editor.addKeyMap({
            'Ctrl-S': () => onContentSaved(),
            'Cmd-S': () => onContentSaved(),
            'Ctrl-F': (_cm: any) => {
                // Focus search input instead of opening default search
                const searchInput = document.querySelector('.persistent-search-input') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            },
            F3: (_cm: any) => {
                findNext();
            },
            'Shift-F3': (_cm: any) => {
                findPrevious();
            },
            Escape: (_cm: any) => {
                clearSearch();
            },
        });

        fetchContent(() => Promise.resolve(editor.getValue()));
    }, [editor, fetchContent, onContentSaved, findNext, findPrevious, clearSearch]);

    return (
        <EditorContainer style={style}>
            <SearchBar>
                <FontAwesomeIcon icon={faSearch} className='text-gray-400 mr-2' />
                <input
                    type='text'
                    placeholder='Pesquisar no código...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='persistent-search-input'
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.shiftKey) {
                                findPrevious();
                            } else {
                                findNext();
                            }
                        } else if (e.key === 'Escape') {
                            clearSearch();
                        }
                    }}
                />
                <button
                    onClick={findPrevious}
                    disabled={!searchQuery || totalMatches === 0}
                    title='Anterior (Shift+F3)'
                >
                    <FontAwesomeIcon icon={faChevronUp} />
                </button>
                <button onClick={findNext} disabled={!searchQuery || totalMatches === 0} title='Próximo (F3)'>
                    <FontAwesomeIcon icon={faChevronDown} />
                </button>
                {searchQuery && (
                    <>
                        <span className='search-info'>
                            {totalMatches > 0 ? `${currentMatch}/${totalMatches}` : 'Nenhum resultado'}
                        </span>
                        <button onClick={clearSearch} title='Limpar pesquisa (Esc)'>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </>
                )}
            </SearchBar>
            <textarea ref={ref} />
        </EditorContainer>
    );
};
