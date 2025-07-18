import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism-tomorrow.css';

const CodeEditor = ({ language, value, onChange }) => {
    const prismLang = languages[language] || languages.clike;

    return (
        <div className="bg-gray-800 rounded-md p-2 border border-gray-600">
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={(code) => highlight(code, prismLang, language)}
                padding={10}
                style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    outline: 'none',
                    color: '#f8f8f2' // Light text color for dark background
                }}
            />
        </div>
    );
};

export default CodeEditor;
